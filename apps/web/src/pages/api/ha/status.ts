/**
 * HA Status API Endpoint
 * GET /api/ha/status
 *
 * Returns comprehensive system health: HA connection, Supervisor addon info,
 * database health, and runtime mode.
 *
 * HA Ingress compatible — uses internal Supervisor proxy.
 * Addon self-info available without `hassio_api: true` per HA docs.
 *
 * @domain ha
 * @bounded-context integration
 */
import type { APIRoute } from "astro";
import { getHAConnectionStatus, getHAConfig } from "../../../domains/ha";
import { logApiError } from "../../../lib/api-logger";
import { supervisorFetch } from "../../../lib/supervisor-fetch";

/** Fetch addon self-info from Supervisor internal proxy */
async function getAddonSelfInfo(): Promise<Record<string, unknown> | null> {
  try {
    const res = await supervisorFetch("/addons/self/info");
    if (!res || !res.ok) return null;
    const json = await res.json() as { data?: Record<string, unknown> };
    return json.data ?? null;
  } catch {
    return null;
  }
}

/** Quick DB health check — attempt a trivial query */
async function checkDbHealth(): Promise<{ ok: boolean; latency_ms: number }> {
  try {
    const { ensureSchema, getPersistenceClient } = await import("@domains/tasks/persistence/store");
    await ensureSchema();
    const client = getPersistenceClient();
    const start = performance.now();
    await client.execute("SELECT 1");
    return { ok: true, latency_ms: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, latency_ms: -1 };
  }
}

export const GET: APIRoute = async () => {
  try {
    const [status, addonInfo, dbHealth] = await Promise.all([
      Promise.resolve(getHAConnectionStatus()),
      getAddonSelfInfo(),
      checkDbHealth(),
    ]);
    const config = status.connected ? await getHAConfig() : null;

    return new Response(JSON.stringify({
      ha: {
        connected: status.connected,
        version: status.haVersion,
        last_error: status.lastError,
        reconnect_attempts: status.reconnectAttempts,
      },
      instance: config ? {
        location_name: config.location_name,
        time_zone: config.time_zone,
        version: config.version,
      } : null,
      addon: {
        mode: process.env.SUPERVISOR_TOKEN ? "ha-addon" : "standalone",
        state: addonInfo?.state ?? null,
        version: addonInfo?.version ?? null,
        ...(addonInfo ? {
          memory_usage: addonInfo.memory_usage,
          memory_limit: addonInfo.memory_limit,
          cpu_percent: addonInfo.cpu_percent,
          watchdog: addonInfo.watchdog,
        } : {}),
      },
      database: dbHealth,
    }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    logApiError("ha-status", "Failed to fetch HA status", err);
    return new Response(JSON.stringify({ error: "Failed to fetch status" }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }
};
