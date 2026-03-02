/**
 * HA Status API Endpoint
 * GET /api/ha/status
 * @domain ha
 * @bounded-context integration
 */
import type { APIRoute } from "astro";
import { getHAConnectionStatus, getHAConfig } from "../../../domains/ha";

export const GET: APIRoute = async () => {
  const status = getHAConnectionStatus();
  const config = status.connected ? await getHAConfig() : null;
  return new Response(JSON.stringify({
    ha: { connected: status.connected, version: status.haVersion, last_error: status.lastError, reconnect_attempts: status.reconnectAttempts },
    instance: config ? { location_name: config.location_name, time_zone: config.time_zone, version: config.version } : null,
    addon: { mode: process.env.SUPERVISOR_TOKEN ? "ha-addon" : "standalone" },
  }), { status: 200, headers: { "content-type": "application/json" } });
};
