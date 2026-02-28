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
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 100));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);

  const validSorts = ["created_at", "updated_at", "title", "status", "priority", "due_date"];
  const sortCol = validSorts.includes(sort) ? sort : "created_at";

  let sql = `SELECT id, title, description, status, priority, due_date, labels,
                    framework_payload, calendar_sync_state, parent_id, time_tracked,
                    created_at, updated_at
             FROM tasks`;
  let countSql = "SELECT COUNT(*) as cnt FROM tasks";
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
    const where = ` WHERE ${conditions.join(" AND ")}`;
    sql += where;
    countSql += where;
  }
  sql += ` ORDER BY ${sortCol} ${order} LIMIT ${limit} OFFSET ${offset}`;

  const [result, countResult] = await Promise.all([
    client.execute({ sql, args }),
    client.execute({ sql: countSql, args }),
  ]);
  const total = Number((countResult.rows[0] as Record<string, unknown>)?.cnt ?? 0);
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
      parent_id: r.parent_id ?? null,
      time_tracked: Number(r.time_tracked ?? 0),
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  });

  return new Response(JSON.stringify({ tasks, total, limit, offset }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  await ensureSchema();
  const client = getPersistenceClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // OA-604: Input sanitization
  const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
  const title = rawTitle.replace(/<[^>]*>/g, ""); // Strip HTML tags (XSS prevention)
  if (!title) {
    return new Response(JSON.stringify({ error: "title is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (title.length > 500) {
    return new Response(JSON.stringify({ error: "title must be 500 characters or less" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  // Validate priority (1-5)
  const rawPriority = typeof body.priority === "number" ? body.priority : 3;
  const priority = Math.min(5, Math.max(1, Math.round(rawPriority)));

  // Sanitize description (strip HTML tags like title)
  const rawDesc = typeof body.description === "string" ? body.description.slice(0, 10000) : "";
  const description = rawDesc.replace(/<[^>]*>/g, "");

  // Validate status (allowed enum)
  const allowedStatuses = ["pending", "active", "in_progress", "complete", "done", "todo"];
  const status = typeof body.status === "string" && allowedStatuses.includes(body.status) ? body.status : "pending";

  const due_date = typeof body.due_date === "string" ? body.due_date : null;
  const labels = typeof body.labels === "string" ? body.labels : "[]";

  // Validate framework_payload is valid JSON
  let framework_payload = "{}";
  if (typeof body.framework_payload === "string") {
    try {
      JSON.parse(body.framework_payload);
      framework_payload = body.framework_payload;
    } catch {
      framework_payload = "{}";
    }
  }

  // Validate parent_id (optional reference to another task)
  const parent_id = typeof body.parent_id === "string" ? body.parent_id : null;

  await client.execute({
    sql: `INSERT INTO tasks (id, title, description, status, priority, due_date, labels,
                             framework_payload, calendar_sync_state, parent_id, time_tracked,
                             idempotency_key, request_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, ?, ?, ?, ?)`,
    args: [id, title, description, status, priority, due_date, labels, framework_payload,
      parent_id, crypto.randomUUID(), crypto.randomUUID(), now, now] as InValue[],
  });

  return new Response(JSON.stringify({ id, title, description, status, priority, due_date, labels, parent_id, time_tracked: 0, created_at: now, updated_at: now }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};
