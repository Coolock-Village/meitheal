/**
 * HA WebSocket Connection — Server-Side Singleton
 *
 * Connects to HA Core via the Supervisor internal proxy using
 * `home-assistant-js-websocket`. Uses `SUPERVISOR_TOKEN` for auth.
 *
 * Architecture:
 *   Addon Server → ws://supervisor/core/websocket → HA Core
 *
 * @domain ha
 * @bounded-context integration
 */
import {
  createConnection,
  createLongLivedTokenAuth,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  type Connection,
  type HassConfig,
} from "home-assistant-js-websocket";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

// Polyfill WebSocket for Node.js server-side usage
import WebSocket from "ws";
(globalThis as Record<string, unknown>).WebSocket = WebSocket;

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["ha"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: false,
});

const SYS_REQ = "ha-system"; // sentinel request_id for background operations

// ── State ──

let connection: Connection | null = null;
let connecting = false;
let lastError: string | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY_MS = 30_000;

// ── Public API ──

export async function getHAConnection(): Promise<Connection | null> {
  if (connection) return connection;
  if (connecting) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (!connecting) { clearInterval(check); resolve(connection); }
      }, 100);
    });
  }

  const token = process.env.SUPERVISOR_TOKEN;
  if (!token) {
    logger.log("info", {
      event: "ha.connection.skipped", domain: "ha", component: "ha-connection",
      request_id: SYS_REQ, message: "SUPERVISOR_TOKEN not set — standalone mode",
    });
    return null;
  }

  connecting = true;
  try {
    const auth = createLongLivedTokenAuth("http://supervisor/core", token);
    connection = await createConnection({ auth });
    reconnectAttempts = 0;
    lastError = null;

    logger.log("info", {
      event: "ha.connection.established", domain: "ha", component: "ha-connection",
      request_id: SYS_REQ, message: `Connected to HA Core v${connection.haVersion}`,
    });

    connection.addEventListener("disconnected", () => {
      logger.log("warn", {
        event: "ha.connection.disconnected", domain: "ha", component: "ha-connection",
        request_id: SYS_REQ, message: "Disconnected from HA Core — auto-reconnect will attempt",
      });
    });

    connection.addEventListener("ready", () => {
      reconnectAttempts = 0;
      logger.log("info", {
        event: "ha.connection.reconnected", domain: "ha", component: "ha-connection",
        request_id: SYS_REQ, message: "Reconnected to HA Core",
      });
    });

    return connection;
  } catch (err) {
    const errorCode = err === ERR_CANNOT_CONNECT ? "CANNOT_CONNECT"
      : err === ERR_INVALID_AUTH ? "INVALID_AUTH" : "UNKNOWN";
    lastError = errorCode;
    reconnectAttempts++;

    logger.log("error", {
      event: "ha.connection.failed", domain: "ha", component: "ha-connection",
      request_id: SYS_REQ, err_code: errorCode,
      message: `Failed to connect to HA Core: ${errorCode} (attempt ${reconnectAttempts})`,
    });

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY_MS);
    setTimeout(() => { connection = null; connecting = false; getHAConnection().catch(() => {}); }, delay);
    return null;
  } finally {
    connecting = false;
  }
}

export function getHAConnectionStatus() {
  return {
    connected: connection !== null,
    haVersion: connection?.haVersion ?? null,
    lastError,
    reconnectAttempts,
  };
}

export async function getHAConfig(): Promise<HassConfig | null> {
  const conn = await getHAConnection();
  if (!conn) return null;
  try {
    return await conn.sendMessagePromise<HassConfig>({ type: "get_config" });
  } catch (err) {
    logger.log("error", {
      event: "ha.config.fetch_failed", domain: "ha", component: "ha-connection",
      request_id: SYS_REQ, message: `Failed to fetch HA config: ${err}`,
    });
    return null;
  }
}

export function closeHAConnection(): void {
  if (connection) {
    connection.close();
    connection = null;
    logger.log("info", {
      event: "ha.connection.closed", domain: "ha", component: "ha-connection",
      request_id: SYS_REQ, message: "HA Core connection closed",
    });
  }
}
