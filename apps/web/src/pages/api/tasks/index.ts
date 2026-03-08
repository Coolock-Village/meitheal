import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { sanitize } from "../../../lib/sanitize";
import { formatTicketKey } from "../../../lib/ticket-key";
import { dispatchTaskEvent } from "../../../lib/webhook-dispatcher";
import { logApiError } from "../../../lib/api-logger";
import { isDbUnavailable, db503Response } from "../../../lib/db-fallback";
import { STATUS } from "../../../lib/status-config";
import { VALID_TASK_TYPES } from "@meitheal/domain-tasks";
import type { TaskType } from "@meitheal/domain-tasks";

/** GET /api/tasks — list all tasks, POST /api/tasks — create a task */

export const GET: APIRoute = async ({ url }) => {
  try {
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
                    board_id, custom_fields, start_date, end_date, progress, color,
                    is_favorite, task_type, ticket_number, assigned_to, created_at, updated_at
             FROM tasks`;
  let countSql = "SELECT COUNT(*) as cnt FROM tasks";
  const conditions: string[] = [];
  const args: InValue[] = [];

  if (status) {
    conditions.push("status = ?");
    args.push(status);
  }

  const boardId = url.searchParams.get("board_id");
  if (boardId) {
    conditions.push("board_id = ?");
    args.push(boardId);
  }

  const taskType = url.searchParams.get("task_type");
  if (taskType && VALID_TASK_TYPES.includes(taskType as TaskType)) {
    conditions.push("task_type = ?");
    args.push(taskType);
  }

  const parentId = url.searchParams.get("parent_id");
  if (parentId) {
    conditions.push("parent_id = ?");
    args.push(parentId);
  }

  if (search) {
    conditions.push("(title LIKE ? OR description LIKE ?)");
    args.push(`%${search}%`, `%${search}%`);
  }

  const assignedTo = url.searchParams.get("assigned_to");
  if (assignedTo) {
    conditions.push("assigned_to = ?");
    args.push(assignedTo);
  }

  // Label filter — matches tasks whose inline JSON labels array contains the value
  const label = url.searchParams.get("label");
  if (label) {
    conditions.push("EXISTS (SELECT 1 FROM json_each(tasks.labels) WHERE json_each.value = ?)");
    args.push(label);
  }

  // Favorite filter
  const favoriteParam = url.searchParams.get("favorite");
  if (favoriteParam === "1") {
    conditions.push("is_favorite = 1");
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
    const ticketNum = r.ticket_number != null ? Number(r.ticket_number) : null;
    return {
      id: r.id,
      ticket_number: ticketNum,
      ticket_key: formatTicketKey(ticketNum),
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
      board_id: r.board_id ?? "default",
      custom_fields: typeof r.custom_fields === "string" ? r.custom_fields : "{}",
      start_date: r.start_date ?? null,
      end_date: r.end_date ?? null,
      progress: Number(r.progress ?? 0),
      color: r.color ?? null,
      is_favorite: Number(r.is_favorite ?? 0),
      task_type: r.task_type ?? "task",
      assigned_to: r.assigned_to ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  });

  return new Response(JSON.stringify({ tasks, total, limit, offset }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
  } catch (err) {
    if (isDbUnavailable(err)) return db503Response("tasks-get", err);
    logApiError("tasks-get", "GET failed", err);
    return new Response(JSON.stringify({ error: "Failed to list tasks" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  await ensureSchema();
  const client = getPersistenceClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // OA-604: Input sanitization
  const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
  const title = sanitize(rawTitle); // XSS prevention
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

  // Assign next sequential ticket_number for human-readable key (MTH-N)
  const nextNumResult = await client.execute("SELECT COALESCE(MAX(ticket_number), 0) + 1 AS next_num FROM tasks");
  const ticket_number = Number((nextNumResult.rows[0] as Record<string, unknown>)?.next_num ?? 1);

  // Validate priority (1-5)
  const rawPriority = typeof body.priority === "number" ? body.priority : 3;
  const priority = Math.min(5, Math.max(1, Math.round(rawPriority)));

  // Sanitize description (strip HTML tags like title)
  const rawDesc = typeof body.description === "string" ? body.description.slice(0, 10000) : "";
  const description = sanitize(rawDesc);

  // Validate status — any non-empty alphanumeric/underscore string up to 50 chars
  const rawStatus = typeof body.status === "string" ? body.status.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") : "";
  const status = rawStatus && rawStatus.length <= 50 ? rawStatus : STATUS.PENDING;

  const due_date = typeof body.due_date === "string" ? body.due_date : null;
  // Validate labels is valid JSON array of strings
  let labels = "[]";
  if (body.labels !== undefined) {
    if (typeof body.labels !== "string") {
      return new Response(JSON.stringify({ error: "labels must be a JSON string array" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    try {
      const parsed = JSON.parse(body.labels);
      if (!Array.isArray(parsed) || !parsed.every(item => typeof item === "string")) throw new Error();
      labels = body.labels;
    } catch {
      return new Response(JSON.stringify({ error: "labels must be a valid JSON string array" }), { status: 400, headers: { "content-type": "application/json" } });
    }
  }

  // Validate framework_payload is valid JSON object
  let framework_payload = "{}";
  if (body.framework_payload !== undefined) {
    if (typeof body.framework_payload !== "string") {
      return new Response(JSON.stringify({ error: "framework_payload must be a JSON string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    try {
      const parsed = JSON.parse(body.framework_payload);
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) throw new Error();
      framework_payload = body.framework_payload;
    } catch {
      return new Response(JSON.stringify({ error: "framework_payload must be a valid JSON object string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
  }

  // Validate parent_id (optional reference to another task)
  const parent_id = typeof body.parent_id === "string" ? body.parent_id : null;

  // Board and custom fields
  const board_id = typeof body.board_id === "string" ? body.board_id : "default";

  let custom_fields = "{}";
  if (body.custom_fields !== undefined) {
    if (typeof body.custom_fields !== "string") {
      return new Response(JSON.stringify({ error: "custom_fields must be a JSON string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    try {
      const parsed = JSON.parse(body.custom_fields);
      // must be an object, not array or null
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) throw new Error();
      custom_fields = body.custom_fields;
    } catch {
      return new Response(JSON.stringify({ error: "custom_fields must be a valid JSON object string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
  }

  // Phase 18: Extended fields
  const start_date = typeof body.start_date === "string" ? body.start_date : null;
  const end_date = typeof body.end_date === "string" ? body.end_date : null;
  const progress_raw = typeof body.progress === "number" ? body.progress : 0;
  const progress = Math.min(100, Math.max(0, Math.round(progress_raw)));
  const color = typeof body.color === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(body.color) ? body.color : null;
  const is_favorite = body.is_favorite ? 1 : 0;

  // Phase 20: Agile hierarchy type
  const rawTaskType = typeof body.task_type === "string" ? body.task_type.trim().toLowerCase() : "task";
  const task_type: TaskType = VALID_TASK_TYPES.includes(rawTaskType as TaskType) ? (rawTaskType as TaskType) : "task";

  // Assignments: assigned_to user ID (nullable)
  let assigned_to: string | null = typeof body.assigned_to === "string" ? body.assigned_to.trim() : null;
  if (assigned_to && assigned_to.length > 255) assigned_to = null;

  // Auto-assign from default if not specified
  if (!assigned_to) {
    try {
      const defaultResult = await client.execute(
        "SELECT value FROM app_settings WHERE key = 'default_assignee' LIMIT 1"
      );
      if (defaultResult.rows.length > 0) {
        assigned_to = String((defaultResult.rows[0] as Record<string, unknown>).value);
      }
    } catch { /* ignore — default is optional */ }
  }

  await client.execute({
    sql: `INSERT INTO tasks (id, title, description, status, priority, due_date, labels,
                             framework_payload, calendar_sync_state, parent_id, time_tracked,
                             board_id, custom_fields, start_date, end_date, progress, color, is_favorite,
                             task_type, ticket_number, assigned_to, idempotency_key, request_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, '${STATUS.PENDING}', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, title, description, status, priority, due_date, labels, framework_payload,
      parent_id, board_id, custom_fields, start_date, end_date, progress, color, is_favorite,
      task_type, ticket_number, assigned_to, crypto.randomUUID(), crypto.randomUUID(), now, now] as InValue[],
  });

  const ticket_key = formatTicketKey(ticket_number);
  const taskPayload = { id, ticket_number, ticket_key, title, description, status, priority, due_date, labels, parent_id, board_id, custom_fields, time_tracked: 0, start_date, end_date, progress, color, is_favorite, task_type, assigned_to, created_at: now, updated_at: now };

  dispatchTaskEvent("task.created", taskPayload, typeof body.request_id === "string" ? body.request_id : undefined).catch(() => {});

  // Phase 52: Native Push Notification for Urgent (P1) tasks
  if (priority === 1) {
    import("../../../domains/ha/ha-services").then(({ sendNotification }) => {
      sendNotification("notify", `🚨 Urgent Task: ${title}`, description.slice(0, 100) || "Needs immediate attention.", {
        push: { category: "URGENT_TASK" },
        action_data: { task_id: id, ticket_key },
        actions: [
          { action: `MEITHEAL_TASK_DONE_${id}`, title: "Mark Done" },
          { action: `MEITHEAL_TASK_VIEW_${id}`, title: "View details", uri: `/meitheal/task/${ticket_key}` }
        ]
      }).catch(err => logApiError("ha-notify", "Failed to send urgent task push", err));
    }).catch(() => {});
  }

  return new Response(JSON.stringify(taskPayload), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const purge = url.searchParams.get("purge");
    if (purge !== "all") {
      return new Response(JSON.stringify({ error: "Use ?purge=all to confirm purge" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    await ensureSchema();
    const client = getPersistenceClient();
    // Cascade-delete related data first, then tasks
    await client.execute("DELETE FROM task_activity_log");
    await client.execute("DELETE FROM comments");
    await client.execute("DELETE FROM tasks");
    return new Response(JSON.stringify({ purged: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    logApiError("tasks", "DELETE/purge failed", err);
    return new Response(JSON.stringify({ error: "Failed to purge tasks" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
