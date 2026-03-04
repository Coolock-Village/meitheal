/**
 * HA Startup — Server-Side Integration Initialization
 *
 * Initializes all HA integrations on first request after boot:
 *   - Entity subscription (WebSocket state tracking)
 *   - Todo sync auto-start from persisted settings
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
  enabledCategories: ["ha", "todo"],
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
 *   3. Read saved todo sync settings from SQLite
 *   4. Auto-start todo sync for any configured entities
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
