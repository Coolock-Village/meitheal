import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { apiError, apiJson } from "../../lib/api-response";

/** Process startup time for uptime calculation. */
const startedAt = Date.now();

/** Current addon version (matches config.yaml). */
const VERSION = "0.3.0";

/**
 * GET /api/health — Readiness & liveness probe.
 * Returns service status, version, uptime, and database connectivity.
 */
export const GET: APIRoute = async () => {
  const now = Date.now();
  const uptimeMs = now - startedAt;

  try {
    await ensureSchema();
    const client = getPersistenceClient();
    // Simple connectivity check
    await client.execute("SELECT 1");

    return apiJson({
      status: "ok",
      service: "meitheal-web",
      version: VERSION,
      time: new Date(now).toISOString(),
      uptime_seconds: Math.floor(uptimeMs / 1000),
      db_status: "connected",
    });
  } catch (error) {
    return apiJson({
      status: "degraded",
      service: "meitheal-web",
      version: VERSION,
      time: new Date(now).toISOString(),
      uptime_seconds: Math.floor(uptimeMs / 1000),
      db_status: "error",
      error: error instanceof Error ? error.message : "unknown",
    }, 503);
  }
};

/** HEAD /api/health — Lightweight liveness check (no body). */
export const HEAD: APIRoute = async () => {
  try {
    await ensureSchema();
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
};
