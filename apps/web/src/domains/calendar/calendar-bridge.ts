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
 */
async function syncFromHA(): Promise<void> {
  if (!syncConfig) return;

  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const events = await listCalendarEvents(syncConfig.entityId, start, end);

  logger.log("info", {
    event: "calendar.sync.from_ha", domain: "calendar", component: "calendar-bridge",
    request_id: SYS_REQ, message: `Synced ${events.length} events from HA calendar`,
    metadata: { entity_id: syncConfig.entityId, event_count: events.length },
  });

  // TODO: merge events into SQLite task store
  // For now, events are available via the /api/ha/calendars endpoint
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
