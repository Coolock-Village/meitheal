import { getPersistenceClient } from "@domains/tasks/persistence/store";
import { type DomainEvent, type WebhookSubscriberConfig, emitWebhook } from "@meitheal/integration-core";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["integrations"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: false,
});

export async function dispatchTaskEvent(eventType: string, payload: Record<string, unknown>, requestId?: string) {
  try {
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
