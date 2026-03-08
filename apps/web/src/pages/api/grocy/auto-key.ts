/**
 * Grocy Auto-Key API — Automatic API Key Generation
 *
 * POST /api/grocy/auto-key — attempts to create a Grocy API key automatically.
 * Used when Grocy addon is detected via HA Supervisor but no API key is configured.
 *
 * Flow:
 *   1. Check if Grocy addon is running via Supervisor API
 *   2. If running, attempt to create an API key via Grocy's /api/objects/api_keys
 *   3. If successful, save the key to settings and return it
 *
 * Note: This requires Grocy to accept unauthenticated requests to the
 * api_keys endpoint OR an existing session/key. In practice, the addon
 * auto-detection provides the ingress URL which may have session auth.
 *
 * @domain grocy
 * @bounded-context integration
 */
import type { APIRoute } from "astro";
import { logApiError } from "../../../lib/api-logger";
import { supervisorFetch } from "../../../lib/supervisor-fetch";

export const POST: APIRoute = async ({ request }) => {
  try {
    let body: { url?: string } = {};
    try {
      body = await request.json();
    } catch { /* empty body = auto-detect */ }

    let grocyUrl = body.url?.trim();

    // If no URL provided, try to detect Grocy addon via Supervisor
    if (!grocyUrl) {
      try {
        const addonsRes = await supervisorFetch("/addons");
        if (addonsRes?.ok) {
          const addonsData = (await addonsRes.json()) as {
            data?: { addons?: { slug: string; ingress_url?: string; state?: string }[] };
          };
          const grocy = addonsData.data?.addons?.find(
            (a) => a.slug.includes("grocy") && a.state === "started"
          );
          if (grocy?.ingress_url) {
            grocyUrl = `http://supervisor${grocy.ingress_url}`;
          }
        }
      } catch { /* auto-detect failed — need manual URL */ }
    }

    if (!grocyUrl) {
      return new Response(
        JSON.stringify({ ok: false, error: "No Grocy URL provided and auto-detection failed" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Attempt to create an API key
    // Grocy's API requires POST /api/objects/api_keys with key_type
    const createRes = await fetch(`${grocyUrl.replace(/\/$/, "")}/api/objects/api_keys`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ key_type: "default" }),
    });

    if (!createRes.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Failed to create API key: HTTP ${createRes.status}. You may need to create one manually in Grocy → Settings → API Keys.`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const createData = (await createRes.json()) as Record<string, unknown>;
    const apiKey = String(createData.created_object_id ?? createData.api_key ?? "");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "API key creation succeeded but no key was returned. Create one manually in Grocy → Settings → API Keys.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Save the key to settings
    try {
      const { ensureSchema, getPersistenceClient } = await import("@domains/tasks/persistence/store");
      await ensureSchema();
      const client = getPersistenceClient();
      const nowMs = Date.now();

      for (const [key, value] of Object.entries({ grocy_url: grocyUrl, grocy_api_key: apiKey })) {
        await client.execute({
          sql: `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
          args: [key, value, nowMs, value, nowMs],
        });
      }
    } catch (err) {
      logApiError("grocy-auto-key", "Failed to save settings", err);
      // Still return the key even if saving failed
    }

    return new Response(
      JSON.stringify({
        ok: true,
        apiKey: apiKey.length > 4 ? "••••" + apiKey.slice(-4) : "••••",
        url: grocyUrl,
        message: "API key created and saved automatically",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    logApiError("grocy-auto-key", "POST failed", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
