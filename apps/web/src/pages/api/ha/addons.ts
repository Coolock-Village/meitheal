/**
 * HA Addons API — list installed HA Supervisor add-ons
 *
 * GET /api/ha/addons
 *
 * Queries the HA Supervisor REST API for installed add-ons.
 * Used by SettingsIntegrations.astro to auto-detect Grocy, n8n, Node-RED, etc.
 *
 * @domain ha
 * @bounded-context integration
 */
import type { APIRoute } from "astro";

interface SupervisorAddon {
  slug: string;
  name: string;
  state: string;
  version: string;
  ingress_url?: string;
  ingress?: boolean;
}

export const GET: APIRoute = async () => {
  const token = process.env.SUPERVISOR_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({ addons: [], message: "Not running as HA addon" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const res = await fetch("http://supervisor/addons", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`[api/ha/addons] Supervisor API returned ${res.status}`);
      return new Response(
        JSON.stringify({ addons: [], message: `Supervisor API error: ${res.status}` }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = (await res.json()) as {
      data?: { addons?: SupervisorAddon[] };
    };

    const addons = (data.data?.addons ?? []).map((a) => ({
      slug: a.slug,
      name: a.name,
      state: a.state,
      version: a.version,
      ingress_url: a.ingress_url ?? null,
    }));

    return new Response(JSON.stringify({ addons }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[api/ha/addons] Failed:", err);
    return new Response(
      JSON.stringify({ addons: [], message: "Failed to query Supervisor API" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
