/**
 * Todo Sync API — Manual Sync Trigger & Status
 *
 * POST /api/todo/sync — trigger manual sync
 * GET  /api/todo/sync — get sync status
 *
 * @domain todo
 * @bounded-context integration
 */
import type { APIRoute } from "astro";
import { syncTodoFromHA, getTodoSyncStatus, startTodoSync, stopTodoSync } from "@domains/todo";

/**
 * GET /api/todo/sync — returns current sync status for all entities
 */
export const GET: APIRoute = async () => {
  try {
    const status = getTodoSyncStatus();
    return new Response(JSON.stringify({ ok: true, sync: status }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[api/todo/sync] GET failed:", err);
    return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/todo/sync
 * Body: { action: "sync" | "enable" | "disable", entity_id?, direction? }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    let body: {
      action?: "sync" | "enable" | "disable";
      entity_id?: string;
      direction?: "inbound" | "outbound" | "bidirectional";
    };

    try {
      body = await request.json();
    } catch (parseErr) {
      console.error("[api/todo/sync] POST invalid JSON:", parseErr);
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const action = body.action ?? "sync";

    switch (action) {
      case "sync": {
        await syncTodoFromHA(body.entity_id);
        const status = getTodoSyncStatus(body.entity_id);
        return new Response(JSON.stringify({ ok: true, status }), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      }

      case "enable": {
        if (!body.entity_id) {
          return new Response(JSON.stringify({ ok: false, error: "entity_id required" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }
        startTodoSync({
          entityId: body.entity_id,
          syncEnabled: true,
          writeBack: body.direction === "outbound" || body.direction === "bidirectional",
          syncDirection: body.direction ?? "bidirectional",
        });
        return new Response(JSON.stringify({ ok: true, message: `Sync enabled for ${body.entity_id}` }), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      }

      case "disable": {
        if (!body.entity_id) {
          return new Response(JSON.stringify({ ok: false, error: "entity_id required" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }
        stopTodoSync(body.entity_id);
        return new Response(JSON.stringify({ ok: true, message: `Sync disabled for ${body.entity_id}` }), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      }

      default:
        console.warn("[api/todo/sync] Unknown action received:", action);
        return new Response(JSON.stringify({ ok: false, error: "Unknown action" }), {
          status: 400, headers: { "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("[api/todo/sync] POST failed:", err);
    return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
