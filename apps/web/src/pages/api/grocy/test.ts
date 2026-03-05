/**
 * Grocy Test API — Connection Validation
 *
 * POST /api/grocy/test — validates Grocy URL + API key
 * Returns Grocy version info and entity counts on success.
 *
 * @domain grocy
 * @bounded-context integration
 */
import type { APIRoute } from "astro";
import { GrocyAdapter } from "@meitheal/integration-core";

/**
 * POST /api/grocy/test
 * Body: { url: string, api_key: string }
 *
 * Tests connection to a Grocy instance and returns system info.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    let body: { url?: string; api_key?: string };

    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = body.url?.trim();
    const apiKey = body.api_key?.trim();

    if (!url || !apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Both url and api_key are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const adapter = new GrocyAdapter({ baseUrl: url, apiKey, timeoutMs: 5000 });

    // Test connection with system info endpoint
    const sysResult = await adapter.getSystemInfo();

    if (!sysResult.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Connection failed: ${sysResult.message}`,
          errorCode: sysResult.errorCode,
          retryable: sysResult.retryable,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch counts for display
    let choreCount = 0;
    let taskCount = 0;
    let shoppingCount = 0;

    const [choresRes, tasksRes, shoppingRes] = await Promise.allSettled([
      adapter.getChores(),
      adapter.getTasks(false),
      adapter.getShoppingList(),
    ]);

    if (choresRes.status === "fulfilled" && choresRes.value.ok) {
      choreCount = choresRes.value.data.length;
    }
    if (tasksRes.status === "fulfilled" && tasksRes.value.ok) {
      taskCount = tasksRes.value.data.length;
    }
    if (shoppingRes.status === "fulfilled" && shoppingRes.value.ok) {
      shoppingCount = shoppingRes.value.data.length;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        version: sysResult.data.grocyVersionInfo.Version,
        releaseDate: sysResult.data.grocyVersionInfo.ReleaseDate,
        counts: { chores: choreCount, tasks: taskCount, shoppingItems: shoppingCount },
        message: `Connected to Grocy ${sysResult.data.grocyVersionInfo.Version}`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[api/grocy/test] POST failed:", err);
    return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
