import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

/** GET /api/tasks — list all tasks, POST /api/tasks — create a task */

export const GET: APIRoute = async ({ url }) => {
  await ensureSchema();
  const client = getPersistenceClient();
  const status = url.searchParams.get("status");
  const sort = url.searchParams.get("sort") ?? "created_at";
  const order = url.searchParams.get("order") === "asc" ? "ASC" : "DESC";
  const search = url.searchParams.get("q");

  const validSorts = ["created_at", "updated_at", "title", "status", "priority", "due_date"];
  const sortCol = validSorts.includes(sort) ? sort : "created_at";

  let sql = `SELECT id, title, description, status, priority, due_date, labels,
                    framework_payload, calendar_sync_state, created_at, updated_at
             FROM tasks`;
  const conditions: string[] = [];
  const args: InValue[] = [];

  if (status) {
    conditions.push("status = ?");
    args.push(status);
  }
  if (search) {
    conditions.push("(title LIKE ? OR description LIKE ?)");
    args.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += ` ORDER BY ${sortCol} ${order}`;

  const result = await client.execute({ sql, args });
  const tasks = result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      status: r.status,
      priority: Number(r.priority ?? 3),
      due_date: r.due_date ?? null,
      labels: r.labels ? String(r.labels) : "[]",
      framework_payload: typeof r.framework_payload === "string" ? r.framework_payload : "{}",
      calendar_sync_state: r.calendar_sync_state ?? "pending",
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  });

  return new Response(JSON.stringify({ tasks, total: tasks.length }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  await ensureSchema();
  const client = getPersistenceClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return new Response(JSON.stringify({ error: "title is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const priority = typeof body.priority === "number" ? body.priority : 3;
  const description = typeof body.description === "string" ? body.description : "";
  const status = typeof body.status === "string" ? body.status : "pending";
  const due_date = typeof body.due_date === "string" ? body.due_date : null;
  const labels = typeof body.labels === "string" ? body.labels : "[]";
  const framework_payload = typeof body.framework_payload === "string" ? body.framework_payload : "{}";

  await client.execute({
    sql: `INSERT INTO tasks (id, title, description, status, priority, due_date, labels,
                             framework_payload, calendar_sync_state, idempotency_key, request_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
    args: [id, title, description, status, priority, due_date, labels, framework_payload,
           crypto.randomUUID(), crypto.randomUUID(), now, now] as InValue[],
  });

  return new Response(JSON.stringify({ id, title, description, status, priority, due_date, labels, created_at: now, updated_at: now }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};
