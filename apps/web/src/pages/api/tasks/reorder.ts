/**
 * POST /api/tasks/reorder — Persist kanban card positions within a lane.
 *
 * Body: { ordered_ids: string[] }
 *   - ordered_ids: task IDs in the user's desired order
 *
 * Sets kanban_position = index for each task ID in the array.
 */
import type { APIRoute } from "astro";
import {
  ensureSchema,
  getPersistenceClient,
} from "@domains/tasks/persistence/store";
import { apiLogger, logApiError } from "../../../lib/api-logger";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as { ordered_ids?: string[] };
    if (
      !body.ordered_ids ||
      !Array.isArray(body.ordered_ids) ||
      body.ordered_ids.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "ordered_ids array required" }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    await ensureSchema();
    const client = getPersistenceClient();
    const now = Date.now();

    // Batch update positions — each ID gets its index as position
    const batch = body.ordered_ids.map((id: string, idx: number) => ({
      sql: "UPDATE tasks SET kanban_position = ?, updated_at = ? WHERE id = ?",
      args: [idx, now, id],
    }));

    await client.batch(batch);
    apiLogger.log("info", { event: "reorder.success", domain: "tasks", component: "reorder", request_id: "kanban-reorder", message: `Reordered ${body.ordered_ids.length} tasks` });

    return new Response(
      JSON.stringify({ ok: true, count: body.ordered_ids.length }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch (err: unknown) {
    logApiError("POST", "/api/tasks/reorder", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
