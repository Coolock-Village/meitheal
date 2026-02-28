import type { APIRoute } from "astro";

/**
 * HA Connection Test API
 * Tests actual connectivity to Home Assistant by:
 * 1. Using SUPERVISOR_TOKEN + http://supervisor/core/api/ when available (HA add-on env)
 * 2. Falling back to HA_BASE_URL + HA_TOKEN (standalone mode)
 * 3. Returning connection status, HA version, and available integrations
 */
export const GET: APIRoute = async () => {
  const supervisorToken = process.env.SUPERVISOR_TOKEN;
  const haBaseUrl = process.env.HA_BASE_URL;
  const haToken = process.env.HA_TOKEN ?? supervisorToken;

  // Determine API base URL
  const apiBase = supervisorToken
    ? "http://supervisor/core/api"
    : haBaseUrl
      ? `${haBaseUrl.replace(/\/$/, "")}/api`
      : null;

  if (!apiBase || !haToken) {
    return new Response(
      JSON.stringify({
        connected: false,
        mode: "unconfigured",
        message: "No HA credentials configured (SUPERVISOR_TOKEN or HA_BASE_URL + HA_TOKEN)",
      }),
      { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }

  const mode = supervisorToken ? "supervisor" : "standalone";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${apiBase}/config`, {
      headers: {
        Authorization: `Bearer ${haToken}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          connected: false,
          mode,
          status: res.status,
          message: `HA API returned ${res.status}`,
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    const config = (await res.json()) as Record<string, unknown>;

    return new Response(
      JSON.stringify({
        connected: true,
        mode,
        version: config.version ?? "unknown",
        location_name: config.location_name ?? "Home",
        time_zone: config.time_zone ?? "UTC",
        components: Array.isArray(config.components)
          ? (config.components as string[]).filter((c) =>
            ["calendar", "todo", "automation", "script", "webhook"].includes(c)
          )
          : [],
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    const message =
      e instanceof Error && e.name === "AbortError"
        ? "Connection timed out (5s)"
        : e instanceof Error
          ? e.message
          : "Unknown error";

    return new Response(
      JSON.stringify({
        connected: false,
        mode,
        message,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
};
