/**
 * Calendar Bridge — Multi-Calendar Bi-Directional Sync
 *
 * Syncs Meitheal tasks with multiple HA calendar entities simultaneously:
 *   - HA calendar → Meitheal: entity state changes trigger event fetch
 *   - Meitheal → HA: task due dates create/update HA calendar events
 *
 * Supports:
 *   - Multiple calendar entities syncing concurrently
 *   - Configurable sync interval per entity (or global)
 *   - CalDAV external calendars (future: caldav-client.ts)
 *   - Write-back deduplication and all-day event handling
 *
 * @domain calendar
 * @bounded-context integration
 */
import { onEntityChange, listCalendarEvents, createCalendarEvent } from "../ha";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web", env: process.env.NODE_ENV ?? "development",
  minLevel: "info", enabledCategories: ["ha", "calendar"],
  redactPatterns: defaultRedactionPatterns, auditEnabled: false,
});
const SYS_REQ = "ha-system";

export interface CalendarSyncConfig {
  entityId: string;
  syncEnabled: boolean;
  writeBack: boolean; // push task due dates to HA
  syncIntervalMs: number;
}

/** Per-entity sync state — tracks timer, unsubscribers, and metadata */
interface EntitySyncState {
  config: CalendarSyncConfig;
  timer: ReturnType<typeof setInterval> | null;
  unsubscribers: (() => void)[];
  lastSyncAt: number | null;
  lastSyncEventCount: number | null;
  lastSyncError: string | null;
}

/** Map of entityId → sync state for multi-calendar support */
const activeSyncs = new Map<string, EntitySyncState>();

/**
 * Start simultaneous sync for multiple HA calendar entities.
 * Replaces any previously active syncs.
 */
export function startMultiCalendarSync(configs: CalendarSyncConfig[]): void {
  stopCalendarSync();

  for (const config of configs) {
    if (!config.syncEnabled) continue;
    startSingleEntitySync(config);
  }

  logger.log("info", {
    event: "calendar.sync.multi_started", domain: "calendar", component: "calendar-bridge",
    request_id: SYS_REQ,
    message: `Multi-calendar sync started for ${configs.filter(c => c.syncEnabled).length} entities`,
    metadata: { entities: configs.filter(c => c.syncEnabled).map(c => c.entityId) },
  });
}

/**
 * Legacy single-entity start — wraps into multi-calendar API.
 * Kept for backward compatibility with existing API routes.
 */
export function startCalendarSync(config: CalendarSyncConfig): void {
  // If this specific entity is already syncing, stop it first
  const existing = activeSyncs.get(config.entityId);
  if (existing) {
    stopSingleEntitySync(config.entityId);
  }

  if (!config.syncEnabled) return;
  startSingleEntitySync(config);
}

/** Internal: start sync for a single entity */
function startSingleEntitySync(config: CalendarSyncConfig): void {
  const state: EntitySyncState = {
    config,
    timer: null,
    unsubscribers: [],
    lastSyncAt: null,
    lastSyncEventCount: null,
    lastSyncError: null,
  };

  // Subscribe to state changes for this calendar entity
  const unsub = onEntityChange(config.entityId, async () => {
    logger.log("info", {
      event: "calendar.sync.entity_changed", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ, message: `Calendar entity ${config.entityId} changed — syncing`,
    });
    await syncEntityFromHA(config.entityId);
  });
  state.unsubscribers.push(unsub);

  // Periodic full sync
  state.timer = setInterval(async () => {
    await syncEntityFromHA(config.entityId);
  }, config.syncIntervalMs);

  activeSyncs.set(config.entityId, state);

  // Initial sync
  syncEntityFromHA(config.entityId).catch((err) => {
    logger.log("error", {
      event: "calendar.sync.initial_failed", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ, message: `Initial calendar sync failed for ${config.entityId}: ${err}`,
    });
  });

  logger.log("info", {
    event: "calendar.sync.entity_started", domain: "calendar", component: "calendar-bridge",
    request_id: SYS_REQ,
    message: `Calendar sync started for ${config.entityId} (interval: ${config.syncIntervalMs}ms, writeBack: ${config.writeBack})`,
  });
}

/**
 * Sync events FROM all configured HA calendars TO Meitheal.
 * Returns aggregated results across all entities.
 */
export async function syncFromHA(overrideEntityId?: string): Promise<{ created: number; updated: number; total: number }> {
  // If a specific entity is requested, sync just that one
  if (overrideEntityId) {
    return syncEntityFromHA(overrideEntityId);
  }

  // If no entities configured, return empty
  if (activeSyncs.size === 0) {
    logger.log("warn", {
      event: "calendar.sync.no_entities", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ, message: "syncFromHA called with no entities configured",
    });
    return { created: 0, updated: 0, total: 0 };
  }

  // Sync ALL configured entities in parallel
  const results = await Promise.allSettled(
    Array.from(activeSyncs.keys()).map((entityId) => syncEntityFromHA(entityId)),
  );

  const aggregated = { created: 0, updated: 0, total: 0 };
  for (const result of results) {
    if (result.status === "fulfilled") {
      aggregated.created += result.value.created;
      aggregated.updated += result.value.updated;
      aggregated.total += result.value.total;
    }
  }

  logger.log("info", {
    event: "calendar.sync.multi_complete", domain: "calendar", component: "calendar-bridge",
    request_id: SYS_REQ,
    message: `Multi-calendar sync: ${aggregated.created} created, ${aggregated.updated} updated from ${aggregated.total} events across ${activeSyncs.size} calendars`,
  });

  return aggregated;
}

/**
 * Sync events FROM a single HA calendar entity TO Meitheal.
 * Merges calendar events into the tasks table with deduplication
 * via the calendar_confirmations table (keyed by provider_event_id).
 */
async function syncEntityFromHA(entityId: string): Promise<{ created: number; updated: number; total: number }> {
  const state = activeSyncs.get(entityId);

  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const events = await listCalendarEvents(entityId, start, end);

  if (events.length === 0) {
    logger.log("debug", {
      event: "calendar.sync.from_ha", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ, message: `No events to sync from ${entityId}`,
    });
    if (state) {
      state.lastSyncAt = Date.now();
      state.lastSyncEventCount = 0;
      state.lastSyncError = null;
    }
    return { created: 0, updated: 0, total: 0 };
  }

  try {
    const { ensureSchema, getPersistenceClient } = await import("@domains/tasks/persistence/store");
    await ensureSchema();
    const client = getPersistenceClient();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const evt of events) {
      const uid = evt.uid ?? `ha-cal-${entityId}-${evt.summary}-${evt.start}`;

      // Check if we already have a confirmation for this event
      const existing = await client.execute({
        sql: "SELECT task_id FROM calendar_confirmations WHERE provider_event_id = ?",
        args: [uid],
      });

      if (existing.rows.length > 0) {
        // Update existing task's due_date if changed
        const taskId = existing.rows[0]!.task_id as string;
        await client.execute({
          sql: "UPDATE tasks SET due_date = ?, description = COALESCE(?, description), updated_at = ? WHERE id = ?",
          args: [evt.start, evt.description ?? null, Date.now(), taskId],
        });
        updated++;
      } else {
        // Create new task from calendar event
        const taskId = crypto.randomUUID();
        const reqId = crypto.randomUUID();
        const nowMs = Date.now();

        await client.execute({
          sql: `INSERT INTO tasks (id, title, description, status, priority, due_date,
                  labels, framework_payload, calendar_sync_state, board_id,
                  custom_fields, task_type, idempotency_key, request_id,
                  created_at, updated_at)
                VALUES (?, ?, ?, 'todo', 3, ?, '[]', '{}', 'synced', 'default',
                  '{}', 'task', ?, ?, ?, ?)`,
          args: [
            taskId,
            evt.summary,
            evt.description ?? "",
            evt.start,
            `cal-sync-${uid}`,
            reqId,
            nowMs,
            nowMs,
          ],
        });

        // Record confirmation for deduplication — include source entity for multi-cal tracking
        await client.execute({
          sql: `INSERT INTO calendar_confirmations (confirmation_id, task_id, request_id, provider_event_id,
                  source, payload, created_at) VALUES (?, ?, ?, ?, 'ha.calendar_sync', ?, ?)`,
          args: [
            crypto.randomUUID(),
            taskId,
            reqId,
            uid,
            JSON.stringify({ summary: evt.summary, start: evt.start, end: evt.end, entity_id: entityId }),
            nowMs,
          ],
        });

        created++;
      }
    }

    if (state) {
      state.lastSyncAt = Date.now();
      state.lastSyncEventCount = events.length;
      state.lastSyncError = null;
    }

    logger.log("info", {
      event: "calendar.sync.from_ha", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ,
      message: `Calendar sync complete for ${entityId}: ${created} created, ${updated} updated, ${skipped} skipped from ${events.length} events`,
      metadata: { entity_id: entityId, event_count: events.length, created, updated, skipped },
    });

    return { created, updated, total: events.length };
  } catch (err) {
    if (state) {
      state.lastSyncError = String(err);
      state.lastSyncAt = Date.now();
    }
    logger.log("error", {
      event: "calendar.sync.merge_failed", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ, message: `Failed to merge calendar events from ${entityId}: ${err}`,
    });
    return { created: 0, updated: 0, total: 0 };
  }
}

/**
 * Push a task due date TO HA calendar — supports write-back deduplication.
 * If dueDate has no time component (YYYY-MM-DD only), creates an all-day event.
 */
export async function pushTaskToCalendar(
  taskId: string, title: string, dueDate: string, description?: string,
  targetEntityId?: string,
): Promise<boolean> {
  // Find the first entity with writeBack enabled, or use targetEntityId
  let writeBackEntity: CalendarSyncConfig | undefined;
  if (targetEntityId) {
    writeBackEntity = activeSyncs.get(targetEntityId)?.config;
  } else {
    for (const [, state] of activeSyncs) {
      if (state.config.writeBack) {
        writeBackEntity = state.config;
        break;
      }
    }
  }

  if (!writeBackEntity?.writeBack) return false;

  // Deduplication: check if we already pushed this task
  try {
    const { ensureSchema, getPersistenceClient } = await import("@domains/tasks/persistence/store");
    await ensureSchema();
    const client = getPersistenceClient();
    const existing = await client.execute({
      sql: "SELECT confirmation_id FROM calendar_confirmations WHERE task_id = ? AND source = 'ha.write_back'",
      args: [taskId],
    });
    if (existing.rows.length > 0) {
      logger.log("debug", {
        event: "calendar.writeback.dedup", domain: "calendar", component: "calendar-bridge",
        request_id: SYS_REQ, message: `Write-back already exists for task ${taskId} — skipping`,
      });
      return true; // Already pushed
    }
  } catch { /* DB not available — proceed anyway */ }

  // All-day event detection: if dueDate is YYYY-MM-DD (no time), create all-day
  const isAllDay = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);

  let start: string;
  let end: string;
  if (isAllDay) {
    start = dueDate;
    // All-day events: end date is exclusive (next day)
    const d = new Date(dueDate);
    d.setDate(d.getDate() + 1);
    end = d.toISOString().slice(0, 10);
  } else {
    start = dueDate;
    // Default 1-hour duration
    end = new Date(new Date(dueDate).getTime() + 60 * 60 * 1000).toISOString();
  }

  const success = await createCalendarEvent(writeBackEntity.entityId, {
    summary: title,
    start,
    end,
    description: description ? `Task: ${taskId}\n${description}` : `Task: ${taskId}`,
  });

  if (success) {
    // Record write-back confirmation for deduplication
    try {
      const { getPersistenceClient } = await import("@domains/tasks/persistence/store");
      const client = getPersistenceClient();
      await client.execute({
        sql: `INSERT INTO calendar_confirmations (confirmation_id, task_id, request_id, provider_event_id,
                source, payload, created_at) VALUES (?, ?, ?, ?, 'ha.write_back', ?, ?)`,
        args: [
          crypto.randomUUID(),
          taskId,
          crypto.randomUUID(),
          `writeback-${taskId}`,
          JSON.stringify({ entity_id: writeBackEntity.entityId, title, start, end }),
          Date.now(),
        ],
      });
    } catch { /* non-critical */ }

    logger.log("info", {
      event: "calendar.sync.pushed_to_ha", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ, message: `Pushed task "${title}" to HA calendar ${writeBackEntity.entityId}`,
      metadata: { task_id: taskId, all_day: isAllDay },
    });
  }

  return success;
}

/** Stop sync for a single entity */
function stopSingleEntitySync(entityId: string): void {
  const state = activeSyncs.get(entityId);
  if (!state) return;
  if (state.timer) clearInterval(state.timer);
  state.unsubscribers.forEach((u) => u());
  activeSyncs.delete(entityId);
}

/**
 * Stop all calendar syncs and clean up.
 */
export function stopCalendarSync(): void {
  for (const [entityId] of activeSyncs) {
    stopSingleEntitySync(entityId);
  }
}

/**
 * Get current sync status — returns per-entity statuses for multi-calendar support.
 */
export function getCalendarSyncStatus() {
  if (activeSyncs.size === 0) {
    return {
      active: false,
      entities: [],
      entityId: null, // legacy compat
      writeBack: false,
      lastSyncAt: null,
      lastSyncEventCount: null,
      lastSyncError: null,
    };
  }

  const entities = Array.from(activeSyncs.entries()).map(([entityId, state]) => ({
    entityId,
    writeBack: state.config.writeBack,
    syncIntervalMs: state.config.syncIntervalMs,
    lastSyncAt: state.lastSyncAt,
    lastSyncEventCount: state.lastSyncEventCount,
    lastSyncError: state.lastSyncError,
  }));

  // Legacy compat — return first entity's data at top level
  const first = entities[0];

  return {
    active: true,
    entities,
    entityCount: entities.length,
    entityId: first?.entityId ?? null,
    writeBack: entities.some((e) => e.writeBack),
    lastSyncAt: first?.lastSyncAt ?? null,
    lastSyncEventCount: entities.reduce((sum, e) => sum + (e.lastSyncEventCount ?? 0), 0),
    lastSyncError: entities.find((e) => e.lastSyncError)?.lastSyncError ?? null,
  };
}

/**
 * Get current sync config for all entities (for introspection by API routes).
 */
export function getCalendarSyncConfigs(): CalendarSyncConfig[] {
  return Array.from(activeSyncs.values()).map((s) => s.config);
}

/**
 * Get current sync config (legacy single-entity — returns first).
 */
export function getCalendarSyncConfig(): CalendarSyncConfig | null {
  const first = activeSyncs.values().next();
  return first.done ? null : first.value.config;
}
