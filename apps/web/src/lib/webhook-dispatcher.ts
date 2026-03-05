/**
 * Webhook Dispatcher — Unified Event Pipeline
 *
 * Dispatches task events to:
 *   1. HA Event Bus (Addon mode — for Node-RED/n8n auto integration)
 *   2. HTTP Webhooks (Standalone mode — n8n/Node-RED/generic webhooks)
 *
 * Every task CRUD operation calls `dispatchTaskEvent`, making this
 * the single integration point for all outbound event delivery.
 *
 * @domain integrations
 * @bounded-context event-dispatch
 */
import { getPersistenceClient } from "@domains/tasks/persistence/store";
import { type DomainEvent, type WebhookSubscriberConfig, emitWebhook } from "@meitheal/integration-core";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";
import { fireHAEvent, type MeithealTaskEventData, type MeithealEventType } from "@domains/ha/ha-events";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["integrations"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: false,
});

/**
 * Map webhook event types → HA event bus event types.
 * Node-RED/n8n listen for these via HA WebSocket `events: all` or
 * `events: state_changed` triggers.
 */
const HA_EVENT_MAP: Record<string, MeithealEventType> = {
  "task.created": "meitheal_task_created",
  "task.updated": "meitheal_task_updated",
  "task.completed": "meitheal_task_completed",
  "task.deleted": "meitheal_task_deleted",
};

/**
 * Read n8n auto-mode event filter from settings.
 * The Settings UI persists events under `n8n_events` for both auto and
 * standalone modes. Returns the list of enabled event types, defaulting to all.
 */
async function getN8nAutoEvents(): Promise<string[]> {
  try {
    const client = getPersistenceClient();
    const result = await client.execute(
      "SELECT value FROM settings WHERE key = 'n8n_events'"
    );
    if (result.rows.length > 0) {
      const parsed = JSON.parse(String(result.rows[0]!.value));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* fall through to defaults */ }
  // Default: all events enabled
  return ["task.created", "task.updated", "task.completed", "task.deleted"];
}

export async function dispatchTaskEvent(eventType: string, payload: Record<string, unknown>, requestId?: string) {
  try {
    // ── 1. HA Event Bus (Addon mode — Node-RED/n8n auto) ──
    // Fire meitheal_task_* events on the HA event bus so Node-RED/n8n
    // can trigger on them via the HA WebSocket integration.
    const haEventType = HA_EVENT_MAP[eventType];
    if (haEventType && process.env.SUPERVISOR_TOKEN) {
      const enabledEvents = await getN8nAutoEvents();
      if (enabledEvents.includes(eventType) || enabledEvents.includes("*")) {
        const eventData: MeithealTaskEventData = {
          task_id: String(payload.id ?? ""),
          title: String(payload.title ?? ""),
          ...(payload.board_id ? { board_id: String(payload.board_id) } : {}),
          ...(payload.board_name ? { board_name: String(payload.board_name) } : {}),
          ...(payload.priority != null ? { priority: String(payload.priority) } : {}),
          ...(payload.due_date ? { due_date: String(payload.due_date) } : {}),
          ...(payload.assigned_to ? { assigned_to: String(payload.assigned_to) } : {}),
        };

        // Fire the mapped event type
        fireHAEvent(haEventType, eventData).catch(() => {});

        // Also fire "completed" event when a task is updated to done status
        if (eventType === "task.updated" && payload.status === "done") {
          fireHAEvent("meitheal_task_completed", {
            ...eventData,
            completed_at: new Date().toISOString(),
          }).catch(() => {});
        }

        logger.log("info", {
          event: "integration.ha_event.dispatched",
          domain: "integrations",
          component: "webhook-dispatcher",
          request_id: requestId ?? "unknown",
          message: `Fired HA event: ${haEventType} for task ${eventData.task_id}`,
        });
      }
    }

    // ── 2. HTTP Webhooks (Standalone mode) ──
    const client = getPersistenceClient();
    const result = await client.execute("SELECT key, value FROM settings WHERE key IN ('webhook_endpoint', 'webhook_secret', 'n8n_webhook_url', 'n8n_events')");

    const settings: Record<string, unknown> = {};
    for (const row of result.rows) {
      try {
        settings[String(row.key)] = JSON.parse(String(row.value));
      } catch {
        settings[String(row.key)] = String(row.value);
      }
    }

    const subscribers: WebhookSubscriberConfig[] = [];

    if (settings.webhook_endpoint) {
      subscribers.push({
        id: "generic-webhook",
        url: String(settings.webhook_endpoint),
        secret: String(settings.webhook_secret || ""),
        events: ["*"],
        enabled: true,
      });
    }

    if (settings.n8n_webhook_url) {
      let events = ["*"];
      if (Array.isArray(settings.n8n_events) && settings.n8n_events.length > 0) {
        events = settings.n8n_events;
      }
      subscribers.push({
        id: "n8n-webhook",
        url: String(settings.n8n_webhook_url),
        secret: "", // n8n doesn't strictly require the secret signature from the UI
        events,
        enabled: true,
      });
    }

    if (subscribers.length === 0) return;

    const event: DomainEvent = {
      eventId: crypto.randomUUID(),
      eventType,
      occurredAt: new Date().toISOString(),
      requestId: requestId ?? crypto.randomUUID(),
      payload,
    };

    // Dispatch background webhook requests without blocking
    Promise.allSettled(
      subscribers
        .filter(s => s.events.includes("*") || s.events.includes(eventType))
        .map(async (s) => {
          const res = await emitWebhook(event, s);
          logger.log(res.ok ? "info" : "warn", {
            event: "integration.webhook.dispatched",
            domain: "integrations",
            component: "webhook-dispatcher",
            request_id: event.requestId,
            message: `Dispatched to ${s.id}. Status: ${res.statusCode}. Attempts: ${res.attempts}. Error: ${res.finalError ?? "none"}`
          });
        })
    );
  } catch (err) {
    logger.log("error", {
      event: "integration.webhook.failed",
      domain: "integrations",
      component: "webhook-dispatcher",
      request_id: requestId ?? "unknown",
      message: err instanceof Error ? err.message : String(err)
    });
  }
}
