import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

/** GET /api/tasks/[id], PUT /api/tasks/[id], DELETE /api/tasks/[id] */

export const GET: APIRoute = async ({ params }) => {
  await ensureSchema();
  const client = getPersistenceClient();
  const result = await client.execute({
    sql: `SELECT id, title, description, status, priority, due_date, labels,
                 framework_payload, calendar_sync_state, created_at, updated_at
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

  const updates: string[] = [];
  const args: InValue[] = [];

  const fields: Record<string, string> = {
    title: "title", description: "description", status: "status",
    priority: "priority", due_date: "due_date", labels: "labels",
    framework_payload: "framework_payload",
  };

  for (const [bodyKey, col] of Object.entries(fields)) {
    if (body[bodyKey] !== undefined) {
      updates.push(`${col} = ?`);
      args.push(body[bodyKey] as InValue);
    }
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
                 framework_payload, calendar_sync_state, created_at, updated_at
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
