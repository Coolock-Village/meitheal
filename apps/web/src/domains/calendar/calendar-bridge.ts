/**
 * Calendar Bridge — Bi-Directional Sync
 *
 * Syncs Meitheal tasks with HA calendar entities:
 *   - HA calendar → Meitheal: entity state changes trigger event fetch
 *   - Meitheal → HA: task due dates create/update HA calendar events
 *
 * @domain calendar
 * @bounded-context integration
 */
import { onEntityChange, listCalendarEvents, createCalendarEvent, getCalendarEntities } from "../ha";
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

let syncConfig: CalendarSyncConfig | null = null;
let syncTimer: ReturnType<typeof setInterval> | null = null;
const unsubscribers: (() => void)[] = [];

/**
 * Initialize calendar sync with a specific HA calendar entity.
 */
export function startCalendarSync(config: CalendarSyncConfig): void {
  stopCalendarSync();
  syncConfig = config;

  if (!config.syncEnabled) return;

  // Subscribe to state changes for the configured calendar entity
  const unsub = onEntityChange(config.entityId, async () => {
    logger.log("info", {
      event: "calendar.sync.entity_changed", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ, message: `Calendar entity ${config.entityId} changed — syncing`,
    });
    await syncFromHA();
  });
  unsubscribers.push(unsub);

  // Periodic full sync
  syncTimer = setInterval(async () => {
    await syncFromHA();
  }, config.syncIntervalMs);

  // Initial sync
  syncFromHA().catch((err) => {
    logger.log("error", {
      event: "calendar.sync.initial_failed", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ, message: `Initial calendar sync failed: ${err}`,
    });
  });

  logger.log("info", {
    event: "calendar.sync.started", domain: "calendar", component: "calendar-bridge",
    request_id: SYS_REQ, message: `Calendar sync started for ${config.entityId}`,
  });
}

/**
 * Sync events FROM HA calendar TO Meitheal.
 * Merges calendar events into the tasks table with deduplication
 * via the calendar_confirmations table (keyed by provider_event_id).
 */
async function syncFromHA(): Promise<void> {
  if (!syncConfig) return;

  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const events = await listCalendarEvents(syncConfig.entityId, start, end);

  if (events.length === 0) {
    logger.log("debug", {
      event: "calendar.sync.from_ha", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ, message: "No events to sync from HA calendar",
    });
    return;
  }

  try {
    const { ensureSchema, getPersistenceClient } = await import("@domains/tasks/persistence/store");
    await ensureSchema();
    const client = getPersistenceClient();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const evt of events) {
      const uid = evt.uid ?? `ha-cal-${syncConfig.entityId}-${evt.summary}-${evt.start}`;

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

        // Record confirmation for deduplication
        await client.execute({
          sql: `INSERT INTO calendar_confirmations (confirmation_id, task_id, request_id, provider_event_id,
                  source, payload, created_at) VALUES (?, ?, ?, ?, 'ha.calendar_sync', ?, ?)`,
          args: [
            crypto.randomUUID(),
            taskId,
            reqId,
            uid,
            JSON.stringify({ summary: evt.summary, start: evt.start, end: evt.end }),
            nowMs,
          ],
        });

        created++;
      }
    }

    logger.log("info", {
      event: "calendar.sync.from_ha", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ,
      message: `Calendar sync complete: ${created} created, ${updated} updated, ${skipped} skipped from ${events.length} events`,
      metadata: { entity_id: syncConfig.entityId, event_count: events.length, created, updated, skipped },
    });
  } catch (err) {
    logger.log("error", {
      event: "calendar.sync.merge_failed", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ, message: `Failed to merge calendar events: ${err}`,
    });
  }
}

/**
 * Push a task due date TO HA calendar.
 */
export async function pushTaskToCalendar(
  taskId: string, title: string, dueDate: string, description?: string,
): Promise<boolean> {
  if (!syncConfig?.writeBack) return false;

  const start = dueDate;
  // Default 1-hour duration
  const end = new Date(new Date(dueDate).getTime() + 60 * 60 * 1000).toISOString();

  const success = await createCalendarEvent(syncConfig.entityId, {
    summary: `[Meitheal] ${title}`,
    start,
    end,
    description: description ? `Task: ${taskId}\n${description}` : `Task: ${taskId}`,
  });

  if (success) {
    logger.log("info", {
      event: "calendar.sync.pushed_to_ha", domain: "calendar", component: "calendar-bridge",
      request_id: SYS_REQ, message: `Pushed task "${title}" to HA calendar`,
      metadata: { task_id: taskId },
    });
  }

  return success;
}

/**
 * Stop calendar sync and clean up.
 */
export function stopCalendarSync(): void {
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
  unsubscribers.forEach((u) => u());
  unsubscribers.length = 0;
  syncConfig = null;
}

/**
 * Get current sync status.
 */
export function getCalendarSyncStatus() {
  return {
    active: syncConfig !== null,
    entityId: syncConfig?.entityId ?? null,
    writeBack: syncConfig?.writeBack ?? false,
  };
}
