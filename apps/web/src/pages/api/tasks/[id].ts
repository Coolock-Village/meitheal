import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

/** GET /api/tasks/[id], PUT /api/tasks/[id], DELETE /api/tasks/[id] */

export const GET: APIRoute = async ({ params }) => {
  await ensureSchema();
  const client = getPersistenceClient();
  const result = await client.execute({
    sql: `SELECT id, title, description, status, priority, due_date, labels,
                 framework_payload, calendar_sync_state, board_id, custom_fields,
                 parent_id, time_tracked, start_date, end_date, progress, color,
                 is_favorite, created_at, updated_at
          FROM tasks WHERE id = ? LIMIT 1`,
    args: [params.id!],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    return new Response(JSON.stringify({ error: "Task not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify(row), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  await ensureSchema();
  const client = getPersistenceClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const now = Date.now();

  // Check task exists
  const existing = await client.execute({
    sql: "SELECT id FROM tasks WHERE id = ? LIMIT 1",
    args: [params.id!],
  });
  if (existing.rows.length === 0) {
    return new Response(JSON.stringify({ error: "Task not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  // Input sanitization — same rules as POST
  const allowedStatuses = ["pending", "active", "in_progress", "complete", "done", "todo"];
  const sanitized: Record<string, InValue> = {};

  if (typeof body.title === "string") {
    const t = body.title.trim().replace(/<[^>]*>/g, "");
    if (!t) {
      return new Response(JSON.stringify({ error: "title cannot be empty" }), {
        status: 400, headers: { "content-type": "application/json" },
      });
    }
    if (t.length > 500) {
      return new Response(JSON.stringify({ error: "title must be 500 characters or less" }), {
        status: 400, headers: { "content-type": "application/json" },
      });
    }
    sanitized.title = t;
  }
  if (typeof body.description === "string") {
    sanitized.description = body.description.slice(0, 10000).replace(/<[^>]*>/g, "");
  }
  if (typeof body.status === "string") {
    if (!allowedStatuses.includes(body.status)) {
      return new Response(JSON.stringify({ error: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` }), {
        status: 400, headers: { "content-type": "application/json" },
      });
    }
    sanitized.status = body.status;
  }
  if (typeof body.priority === "number") {
    sanitized.priority = Math.min(5, Math.max(1, Math.round(body.priority)));
  }
  if (body.due_date !== undefined) {
    sanitized.due_date = typeof body.due_date === "string" ? body.due_date : null;
  }
  if (typeof body.labels === "string") {
    sanitized.labels = body.labels;
  }
  if (typeof body.framework_payload === "string") {
    try { JSON.parse(body.framework_payload); sanitized.framework_payload = body.framework_payload; } catch { /* skip */ }
  }
  if (typeof body.custom_fields === "string") {
    try { JSON.parse(body.custom_fields); sanitized.custom_fields = body.custom_fields; } catch { /* skip */ }
  }
  if (typeof body.board_id === "string") {
    sanitized.board_id = body.board_id;
  }
  // Phase 18: Extended fields
  if (body.start_date !== undefined) {
    sanitized.start_date = typeof body.start_date === "string" ? body.start_date : null;
  }
  if (body.end_date !== undefined) {
    sanitized.end_date = typeof body.end_date === "string" ? body.end_date : null;
  }
  if (typeof body.progress === "number") {
    sanitized.progress = Math.min(100, Math.max(0, Math.round(body.progress)));
  }
  if (body.color !== undefined) {
    sanitized.color = typeof body.color === "string" ? body.color : null;
  }
  if (body.is_favorite !== undefined) {
    sanitized.is_favorite = body.is_favorite ? 1 : 0;
  }

  const updates: string[] = [];
  const args: InValue[] = [];

  for (const [col, val] of Object.entries(sanitized)) {
    updates.push(`${col} = ?`);
    args.push(val);
  }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ error: "No fields to update" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  updates.push("updated_at = ?");
  args.push(now);
  args.push(params.id!);

  await client.execute({
    sql: `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`,
    args,
  });

  // Return updated
  const updated = await client.execute({
    sql: `SELECT id, title, description, status, priority, due_date, labels,
                 framework_payload, calendar_sync_state, board_id, custom_fields,
                 parent_id, time_tracked, start_date, end_date, progress, color,
                 is_favorite, created_at, updated_at
          FROM tasks WHERE id = ? LIMIT 1`,
    args: [params.id!],
  });

  return new Response(JSON.stringify(updated.rows[0]), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await ensureSchema();
  const client = getPersistenceClient();

  const existing = await client.execute({
    sql: "SELECT id FROM tasks WHERE id = ? LIMIT 1",
    args: [params.id!],
  });
  if (existing.rows.length === 0) {
    return new Response(JSON.stringify({ error: "Task not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  await client.execute({ sql: "DELETE FROM tasks WHERE id = ?", args: [params.id!] });

  return new Response(JSON.stringify({ deleted: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
