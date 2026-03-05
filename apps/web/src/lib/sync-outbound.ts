/**
 * Outbound Sync Dispatcher
 *
 * Third dispatch channel in the unified event pipeline.
 * Called by dispatchTaskEvent on task.created / task.updated to push
 * changes to active HA Todo and Calendar syncs.
 *
 * Respects:
 *   - `no-sync` label → skip entirely
 *   - `synced from {entity}` label → don't push back to that entity (loop prevention)
 *   - Only pushes if sync direction is "outbound" or "bidirectional"
 *
 * @domain integrations
 * @bounded-context sync-outbound
 */
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["integrations"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: false,
});

const NO_SYNC_LABEL = "no-sync";
const SYNCED_FROM_PREFIX = "synced from ";

/**
 * Parse labels from task payload.
 * Labels can be a JSON string array or already an array.
 */
function parseLabels(payload: Record<string, unknown>): string[] {
  const raw = payload.labels;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((l): l is string => typeof l === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((l: unknown): l is string => typeof l === "string") : [];
    } catch { return []; }
  }
  return [];
}

/**
 * Extract which entities this task was synced FROM (to prevent push-back loops).
 */
function getSyncedFromEntities(labels: string[]): string[] {
  return labels
    .filter((l) => l.startsWith(SYNCED_FROM_PREFIX))
    .map((l) => l.slice(SYNCED_FROM_PREFIX.length));
}

/**
 * Push a task mutation to all active outbound sync targets.
 *
 * Called by dispatchTaskEvent — fire-and-forget, non-blocking.
 */
export async function pushToActiveSyncs(
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  // Only handle creates and updates
  if (eventType !== "task.created" && eventType !== "task.updated") return;

  const labels = parseLabels(payload);

  // Respect no-sync label
  if (labels.includes(NO_SYNC_LABEL)) {
    logger.log("debug", {
      event: "sync.outbound.skipped_no_sync", domain: "integrations",
      component: "sync-outbound", request_id: "system",
      message: `Skipping outbound push for "${payload.title}" — has no-sync label`,
    });
    return;
  }

  // Entities this task originated from (loop prevention)
  const syncedFromEntities = getSyncedFromEntities(labels);

  const taskId = String(payload.id ?? "");
  const title = String(payload.title ?? "");
  const status = String(payload.status ?? "pending");
  const dueDate = payload.due_date ? String(payload.due_date) : undefined;
  const description = payload.description ? String(payload.description) : undefined;

  if (!taskId || !title) return;

  // ── Todo Sync: push to active todo entities ──
  try {
    const { getActiveTodoSyncConfigs, pushTaskToTodoList } = await import("@domains/todo/todo-bridge");
    const todoConfigs = getActiveTodoSyncConfigs();

    for (const config of todoConfigs) {
      // Loop prevention: don't push back to the entity this task came from
      if (syncedFromEntities.includes(config.entityId)) {
        logger.log("debug", {
          event: "sync.outbound.todo.loop_prevented", domain: "integrations",
          component: "sync-outbound", request_id: "system",
          message: `Skipping push to ${config.entityId} — task synced from there`,
        });
        continue;
      }

      pushTaskToTodoList(
        taskId, title, status, config.entityId, dueDate, description, labels,
      ).catch((err) => {
        logger.log("error", {
          event: "sync.outbound.todo.failed", domain: "integrations",
          component: "sync-outbound", request_id: "system",
          message: `Failed to push to ${config.entityId}: ${err}`,
        });
      });
    }
  } catch (err) {
    logger.log("error", {
      event: "sync.outbound.todo.import_failed", domain: "integrations",
      component: "sync-outbound", request_id: "system",
      message: `Failed to import todo bridge: ${err}`,
    });
  }

  // ── Calendar Sync: push to active calendar entities (if due_date exists) ──
  if (dueDate) {
    try {
      const { pushTaskToCalendar, getCalendarSyncConfigs } = await import("@domains/calendar/calendar-bridge");
      const calConfigs = getCalendarSyncConfigs();
      const hasWriteBack = calConfigs.some((c) => c.writeBack);

      if (hasWriteBack) {
        // pushTaskToCalendar already handles writeBack check and dedup internally
        pushTaskToCalendar(taskId, title, dueDate, description).catch((err) => {
          logger.log("error", {
            event: "sync.outbound.calendar.failed", domain: "integrations",
            component: "sync-outbound", request_id: "system",
            message: `Failed to push to calendar: ${err}`,
          });
        });
      }
    } catch (err) {
      logger.log("error", {
        event: "sync.outbound.calendar.import_failed", domain: "integrations",
        component: "sync-outbound", request_id: "system",
        message: `Failed to import calendar bridge: ${err}`,
      });
    }
  }
}
