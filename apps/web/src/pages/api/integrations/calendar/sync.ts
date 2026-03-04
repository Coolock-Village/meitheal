/**
 * Calendar Sync API — Manual Sync Trigger & Status
 *
 * POST /api/integrations/calendar/sync — trigger manual sync or enable/disable
 * GET  /api/integrations/calendar/sync — get sync status
 *
 * Mirrors /api/todo/sync pattern for API consistency.
 *
 * @domain calendar
 * @bounded-context integration
 */
import type { APIRoute } from "astro";
import {
  startCalendarSync,
  stopCalendarSync,
  getCalendarSyncStatus,
  syncFromHA,
} from "@domains/calendar/calendar-bridge";

/**
 * GET /api/integrations/calendar/sync — returns current sync status
 */
export const GET: APIRoute = async () => {
  try {
    const status = getCalendarSyncStatus();
    return new Response(JSON.stringify({ ok: true, sync: status }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[api/integrations/calendar/sync] GET failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

/**
 * POST /api/integrations/calendar/sync
 * Body: { action: "sync" | "enable" | "disable", entity_id?, write_back?, interval_ms? }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    let body: {
      action?: "sync" | "enable" | "disable";
      entity_id?: string;
      write_back?: boolean;
      interval_ms?: number;
    };

    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const action = body.action ?? "enable";

    switch (action) {
      case "sync": {
        // Trigger an immediate sync (uses existing config if active)
        try {
          await syncFromHA();
          return new Response(
            JSON.stringify({ ok: true, message: "Calendar sync triggered" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ ok: false, error: `Sync failed: ${err}` }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      }

      case "enable": {
        if (!body.entity_id) {
          return new Response(
            JSON.stringify({ ok: false, error: "entity_id required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        startCalendarSync({
          entityId: body.entity_id,
          syncEnabled: true,
          writeBack: body.write_back ?? false,
          syncIntervalMs: body.interval_ms ?? 5 * 60 * 1000,
        });
        return new Response(
          JSON.stringify({
            ok: true,
            message: `Calendar sync enabled for ${body.entity_id}`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      case "disable": {
        stopCalendarSync();
        return new Response(
          JSON.stringify({ ok: true, message: "Calendar sync disabled" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      default:
        return new Response(
          JSON.stringify({ ok: false, error: "Unknown action" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
    }
  } catch (err) {
    console.error("[api/integrations/calendar/sync] POST failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
