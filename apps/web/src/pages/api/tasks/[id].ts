import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { stripHtml } from "../../../lib/strip-html";
import { VALID_TASK_TYPES } from "@meitheal/domain-tasks";
import type { TaskType } from "@meitheal/domain-tasks";

/** GET /api/tasks/[id], PUT /api/tasks/[id], DELETE /api/tasks/[id] */

export const GET: APIRoute = async ({ params }) => {
  await ensureSchema();
  const client = getPersistenceClient();
  const result = await client.execute({
    sql: `SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.labels,
                 t.framework_payload, t.calendar_sync_state, t.board_id, t.custom_fields,
                 t.parent_id, t.time_tracked, t.start_date, t.end_date, t.progress, t.color,
                 t.is_favorite, t.task_type, t.created_at, t.updated_at,
                 p.title as parent_title, p.task_type as parent_task_type
          FROM tasks t
          LEFT JOIN tasks p ON t.parent_id = p.id
          WHERE t.id = ? LIMIT 1`,
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
  const sanitized: Record<string, InValue> = {};

  if (typeof body.title === "string") {
    const t = stripHtml(body.title.trim());
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
    sanitized.description = stripHtml(body.description.slice(0, 10000));
  }
  if (typeof body.status === "string") {
    const st = body.status.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!st || st.length > 50) {
      return new Response(JSON.stringify({ error: "status must be 1-50 alphanumeric/underscore characters" }), {
        status: 400, headers: { "content-type": "application/json" },
      });
    }
    sanitized.status = st;
  }
  if (typeof body.priority === "number") {
    sanitized.priority = Math.min(5, Math.max(1, Math.round(body.priority)));
  }
  if (body.due_date !== undefined) {
    sanitized.due_date = typeof body.due_date === "string" ? body.due_date : null;
  }
  if (body.labels !== undefined) {
    if (typeof body.labels !== "string") {
      return new Response(JSON.stringify({ error: "labels must be a JSON string array" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    try {
      const parsed = JSON.parse(body.labels);
      if (!Array.isArray(parsed) || !parsed.every(item => typeof item === "string")) throw new Error();
      sanitized.labels = body.labels;
    } catch {
      return new Response(JSON.stringify({ error: "labels must be a valid JSON string array" }), { status: 400, headers: { "content-type": "application/json" } });
    }
  }
  if (body.framework_payload !== undefined) {
    if (typeof body.framework_payload !== "string") {
      return new Response(JSON.stringify({ error: "framework_payload must be a JSON string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    try {
      const parsed = JSON.parse(body.framework_payload);
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) throw new Error();
      sanitized.framework_payload = body.framework_payload;
    } catch {
      return new Response(JSON.stringify({ error: "framework_payload must be a valid JSON object string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
  }
  if (body.custom_fields !== undefined) {
    if (typeof body.custom_fields !== "string") {
      return new Response(JSON.stringify({ error: "custom_fields must be a JSON string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    try {
      const parsed = JSON.parse(body.custom_fields);
      // must be an object, not array or null
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) throw new Error();
      sanitized.custom_fields = body.custom_fields;
    } catch {
      return new Response(JSON.stringify({ error: "custom_fields must be a valid JSON object string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
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
    sanitized.color = typeof body.color === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(body.color) ? body.color : null;
  }
  if (body.is_favorite !== undefined) {
    sanitized.is_favorite = body.is_favorite ? 1 : 0;
  }
  if (typeof body.parent_id === "string" || body.parent_id === null) {
    sanitized.parent_id = body.parent_id;
  }
  if (typeof body.time_tracked === "number") {
    sanitized.time_tracked = Math.max(0, Math.round(body.time_tracked));
  }
  // Phase 20: Agile hierarchy type
  if (typeof body.task_type === "string") {
    const tt = body.task_type.trim().toLowerCase();
    if (VALID_TASK_TYPES.includes(tt as TaskType)) {
      sanitized.task_type = tt;
    }
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
                 is_favorite, task_type, created_at, updated_at
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

  return new Response(null, { status: 204 });
};
