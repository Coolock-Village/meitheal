/**
 * HA Calendar API Endpoints
 *
 * GET /api/ha/calendars — list available HA calendar entities
 * GET /api/ha/calendars?entity_id=X&start=Y&end=Z — get events
 * POST /api/ha/calendars — trigger manual sync
 *
 * @domain calendar
 * @bounded-context integration
 */
import type { APIRoute } from "astro";
import { getCalendarEntities, listCalendarEvents } from "../../../domains/ha";
import { getCalendarSyncStatus } from "../../../domains/calendar/calendar-bridge";

export const GET: APIRoute = async ({ url }) => {
  try {
    const entityId = url.searchParams.get("entity_id");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    if (entityId && start && end) {
      // Get events for a specific calendar
      const events = await listCalendarEvents(entityId, start, end);
      return new Response(JSON.stringify({ entity_id: entityId, events }), {
        status: 200, headers: { "content-type": "application/json" },
      });
    }

    // List all calendar entities
    const entities = getCalendarEntities().map((e) => ({
      entity_id: e.entity_id,
      friendly_name: e.attributes?.friendly_name ?? e.entity_id,
      state: e.state,
    }));

    const syncStatus = getCalendarSyncStatus();

    return new Response(JSON.stringify({ calendars: entities, sync: syncStatus }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Calendar API error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }
};

export const POST: APIRoute = async () => {
  // Manual sync trigger — placeholder for now
  return new Response(JSON.stringify({ message: "Calendar sync triggered" }), {
    status: 200, headers: { "content-type": "application/json" },
  });
};
