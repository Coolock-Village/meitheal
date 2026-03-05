/**
 * HA Startup — Server-Side Integration Initialization
 *
 * Initializes all HA integrations on first request after boot:
 *   - Entity subscription (WebSocket state tracking)
 *   - Todo sync auto-start from persisted settings
 *   - Calendar sync auto-start from persisted settings
 *   - Grocy connectivity validation
 *   - n8n/Webhook endpoint reachability validation
 *
 * Called once from middleware.ts via a "lazy init" guard.
 * Must be idempotent — safe to call multiple times.
 *
 * @domain ha
 * @bounded-context integration
 */
import { initEntitySubscription } from "./ha-entities";
import { getHAConnection } from "./ha-connection";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["ha", "todo", "calendar", "integrations"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: false,
});
const SYS_REQ = "ha-system";

let initialized = false;
let initializing = false;

/**
 * Initialize all HA integrations. Idempotent — safe to call on every request.
 *
 * Flow:
 *   1. Establish WebSocket connection to HA Core
 *   2. Subscribe to entity state changes (populates entity cache)
 *   3. Auto-start Todo sync from persisted settings
 *   4. Auto-start Calendar sync from persisted settings
 *   5. Validate Grocy connectivity
 *   6. Validate n8n/webhook endpoint reachability
 */
export async function initHAIntegrations(): Promise<void> {
  if (initialized || initializing) return;
  initializing = true;

  try {
    // Only initialize when running as HA addon (SUPERVISOR_TOKEN present)
    if (!process.env.SUPERVISOR_TOKEN) {
      logger.log("info", {
        event: "ha.startup.skipped",
        domain: "ha",
        component: "ha-startup",
        request_id: SYS_REQ,
        message: "No SUPERVISOR_TOKEN — standalone mode, skipping HA integrations",
      });
      initialized = true;
      return;
    }

    // Step 1: Establish connection
    const conn = await getHAConnection();
    if (!conn) {
      logger.log("warn", {
        event: "ha.startup.no_connection",
        domain: "ha",
        component: "ha-startup",
        request_id: SYS_REQ,
        message: "Could not connect to HA Core — will retry on next request",
      });
      initializing = false;
      return; // Don't mark initialized — retry next request
    }

    // Step 2: Subscribe to entity states (populates the in-memory cache)
    await initEntitySubscription();
    logger.log("info", {
      event: "ha.startup.entities_subscribed",
      domain: "ha",
      component: "ha-startup",
      request_id: SYS_REQ,
      message: "Entity subscription initialized",
    });

    // Step 3: Read saved todo sync settings and auto-start
    await autoStartTodoSync();

    // Step 4: Read saved calendar sync settings and auto-start
    await autoStartCalendarSync();

    // Step 5: Validate Grocy connectivity (non-blocking)
    await validateGrocyConnection();

    // Step 6: Validate webhook/n8n endpoints (non-blocking)
    await validateWebhookEndpoints();

    initialized = true;
    logger.log("info", {
      event: "ha.startup.complete",
      domain: "ha",
      component: "ha-startup",
      request_id: SYS_REQ,
      message: "All HA integrations initialized successfully",
    });
  } catch (err) {
    logger.log("error", {
      event: "ha.startup.failed",
      domain: "ha",
      component: "ha-startup",
      request_id: SYS_REQ,
      message: `HA integration startup failed: ${err}`,
    });
    initializing = false; // Allow retry on next request
  }
}

/**
 * Read persisted todo sync settings from SQLite and auto-start sync.
 */
async function autoStartTodoSync(): Promise<void> {
  try {
    const { ensureSchema, getPersistenceClient } = await import(
      "@domains/tasks/persistence/store"
    );
    await ensureSchema();
    const client = getPersistenceClient();

    // Read todo sync settings
    const res = await client.execute({
      sql: "SELECT key, value FROM settings WHERE key IN ('todo_sync_enabled', 'todo_entity', 'todo_sync_direction')",
      args: [],
    });

    const settings: Record<string, string> = {};
    for (const row of res.rows) {
      if (typeof row.key === "string" && typeof row.value === "string") {
        // Settings values are stored JSON-encoded (with quotes)
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      }
    }

    const enabled =
      settings.todo_sync_enabled === "true" ||
      settings.todo_sync_enabled === true?.toString();
    const entityId = settings.todo_entity;
    const direction =
      (settings.todo_sync_direction as
        | "inbound"
        | "outbound"
        | "bidirectional") ?? "bidirectional";

    if (!enabled || !entityId) {
      logger.log("info", {
        event: "ha.startup.todo_sync.skipped",
        domain: "todo",
        component: "ha-startup",
        request_id: SYS_REQ,
        message: `Todo sync not configured (enabled: ${enabled}, entity: ${entityId ?? "none"})`,
      });
      return;
    }

    // Import and start todo sync
    const { startTodoSync } = await import("@domains/todo");
    startTodoSync({
      entityId,
      syncEnabled: true,
      writeBack:
        direction === "outbound" || direction === "bidirectional",
      syncDirection: direction,
    });

    logger.log("info", {
      event: "ha.startup.todo_sync.started",
      domain: "todo",
      component: "ha-startup",
      request_id: SYS_REQ,
      message: `Auto-started todo sync for ${entityId} (direction: ${direction})`,
    });
  } catch (err) {
    logger.log("error", {
      event: "ha.startup.todo_sync.failed",
      domain: "todo",
      component: "ha-startup",
      request_id: SYS_REQ,
      message: `Failed to auto-start todo sync: ${err}`,
    });
  }
}

/**
 * Read persisted calendar sync settings from SQLite and auto-start sync.
 * Mirrors autoStartTodoSync pattern using calendar-bridge.
 */
async function autoStartCalendarSync(): Promise<void> {
  try {
    const { ensureSchema, getPersistenceClient } = await import(
      "@domains/tasks/persistence/store"
    );
    await ensureSchema();
    const client = getPersistenceClient();

    // Calendar entity can be stored under multiple key variants (legacy: cal_entity, calendar-entity)
    const res = await client.execute({
      sql: "SELECT key, value FROM settings WHERE key IN ('calendar_entity', 'cal_entity', 'calendar-entity', 'calendar_sync_enabled', 'calendar_write_back')",
      args: [],
    });

    const settings: Record<string, string> = {};
    for (const row of res.rows) {
      if (typeof row.key === "string" && typeof row.value === "string") {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      }
    }

    // Resolve entity ID: canonical key first, then legacy fallbacks
    const entityId =
      settings.calendar_entity ?? settings.cal_entity ?? settings["calendar-entity"];
    const enabled = settings.calendar_sync_enabled !== "false"; // default enabled if entity exists
    const writeBack = settings.calendar_write_back === "true";

    // Backward-compat migration: copy legacy key to canonical
    if (entityId && !settings.calendar_entity && (settings.cal_entity || settings["calendar-entity"])) {
      try {
        await client.execute({
          sql: `INSERT INTO settings (key, value, updated_at) VALUES ('calendar_entity', ?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          args: [JSON.stringify(entityId), Date.now()],
        });
        logger.log("info", {
          event: "ha.startup.calendar_sync.key_migrated",
          domain: "calendar", component: "ha-startup",
          request_id: SYS_REQ, message: `Migrated legacy calendar key to calendar_entity: ${entityId}`,
        });
      } catch { /* non-critical */ }
    }

    if (!entityId) {
      logger.log("info", {
        event: "ha.startup.calendar_sync.skipped",
        domain: "calendar",
        component: "ha-startup",
        request_id: SYS_REQ,
        message: "Calendar sync not configured (no entity set)",
      });
      return;
    }

    if (!enabled) {
      logger.log("info", {
        event: "ha.startup.calendar_sync.disabled",
        domain: "calendar",
        component: "ha-startup",
        request_id: SYS_REQ,
        message: `Calendar sync disabled for ${entityId}`,
      });
      return;
    }

    const { startCalendarSync } = await import("@domains/calendar/calendar-bridge");
    startCalendarSync({
      entityId,
      syncEnabled: true,
      writeBack,
      syncIntervalMs: 5 * 60 * 1000, // 5 min default
    });

    logger.log("info", {
      event: "ha.startup.calendar_sync.started",
      domain: "calendar",
      component: "ha-startup",
      request_id: SYS_REQ,
      message: `Auto-started calendar sync for ${entityId} (writeBack: ${writeBack})`,
    });
  } catch (err) {
    logger.log("error", {
      event: "ha.startup.calendar_sync.failed",
      domain: "calendar",
      component: "ha-startup",
      request_id: SYS_REQ,
      message: `Failed to auto-start calendar sync: ${err}`,
    });
  }
}

/**
 * Validate Grocy connectivity on boot.
 * Grocy adapter is stateless (created per-request), but validating the
 * connection early lets us surface config issues in logs immediately.
 */
async function validateGrocyConnection(): Promise<void> {
  try {
    const { createGrocyClient } = await import("../../lib/grocy-client");
    const client = await createGrocyClient();

    if (!client) {
      logger.log("info", {
        event: "ha.startup.grocy.skipped",
        domain: "integrations",
        component: "ha-startup",
        request_id: SYS_REQ,
        message: "Grocy not configured (missing URL or API key)",
      });
      return;
    }

    // Attempt a lightweight API call to validate the connection
    try {
      await client.checkStock([]);
      logger.log("info", {
        event: "ha.startup.grocy.connected",
        domain: "integrations",
        component: "ha-startup",
        request_id: SYS_REQ,
        message: "Grocy connection validated successfully",
      });
    } catch (apiErr) {
      logger.log("warn", {
        event: "ha.startup.grocy.unreachable",
        domain: "integrations",
        component: "ha-startup",
        request_id: SYS_REQ,
        message: `Grocy API unreachable: ${apiErr}`,
      });
    }
  } catch (err) {
    logger.log("error", {
      event: "ha.startup.grocy.failed",
      domain: "integrations",
      component: "ha-startup",
      request_id: SYS_REQ,
      message: `Grocy validation failed: ${err}`,
    });
  }
}

/**
 * Validate webhook/n8n endpoint reachability on boot.
 * Webhooks are event-driven (dispatched per task event), but checking
 * reachability on boot surfaces misconfigured URLs early.
 */
async function validateWebhookEndpoints(): Promise<void> {
  try {
    const { ensureSchema, getPersistenceClient } = await import(
      "@domains/tasks/persistence/store"
    );
    await ensureSchema();
    const client = getPersistenceClient();

    const res = await client.execute({
      sql: "SELECT key, value FROM settings WHERE key IN ('webhook_endpoint', 'n8n_webhook_url')",
      args: [],
    });

    const endpoints: { name: string; url: string }[] = [];
    for (const row of res.rows) {
      if (typeof row.key === "string" && typeof row.value === "string") {
        let url: string;
        try {
          url = JSON.parse(row.value);
        } catch {
          url = row.value;
        }
        if (url) {
          const name = row.key === "n8n_webhook_url" ? "n8n" : "webhook";
          endpoints.push({ name, url });
        }
      }
    }

    if (endpoints.length === 0) {
      logger.log("info", {
        event: "ha.startup.webhooks.skipped",
        domain: "integrations",
        component: "ha-startup",
        request_id: SYS_REQ,
        message: "No webhook endpoints configured",
      });
      return;
    }

    // Validate each endpoint with a lightweight HEAD/GET request
    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        // Use HEAD to minimize payload; fall back to GET if HEAD fails
        const response = await fetch(ep.url, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeout);

        logger.log("info", {
          event: `ha.startup.${ep.name}.reachable`,
          domain: "integrations",
          component: "ha-startup",
          request_id: SYS_REQ,
          message: `${ep.name} endpoint reachable (${response.status}): ${ep.url}`,
        });
      } catch (fetchErr) {
        logger.log("warn", {
          event: `ha.startup.${ep.name}.unreachable`,
          domain: "integrations",
          component: "ha-startup",
          request_id: SYS_REQ,
          message: `${ep.name} endpoint unreachable: ${ep.url} — ${fetchErr}`,
        });
      }
    }
  } catch (err) {
    logger.log("error", {
      event: "ha.startup.webhooks.failed",
      domain: "integrations",
      component: "ha-startup",
      request_id: SYS_REQ,
      message: `Webhook validation failed: ${err}`,
    });
  }
}
