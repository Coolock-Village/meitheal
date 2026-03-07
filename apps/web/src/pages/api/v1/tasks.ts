import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { logApiError } from "../../../lib/api-logger";
import { STATUS } from "../../../lib/status-config";

/**
 * Vikunja-compatible /api/v1/tasks endpoint.
 * Maps Meitheal task fields to Vikunja's schema for migration/interop.
 * Gap matrix: API/webhooks ecosystem — Strong target.
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();

    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const perPage = Math.min(200, Math.max(1, Number(url.searchParams.get("per_page") ?? 50)));
    const offset = (page - 1) * perPage;
    const sort = url.searchParams.get("sort_by") ?? "created";
    const order = url.searchParams.get("order_by") === "asc" ? "ASC" : "DESC";

    const validSorts: Record<string, string> = {
      created: "created_at", updated: "updated_at", title: "title",
      priority: "priority", due_date: "due_date", done: "status",
    };
    const sortCol = validSorts[sort] ?? "created_at";

    const conditions: string[] = [];
    const args: InValue[] = [];

    const filterDone = url.searchParams.get("filter_by")?.includes("complete");
    if (filterDone) {
      const doneValue = url.searchParams.get("filter_value") ?? "";
      if (doneValue === "true") {
        conditions.push(`status = '${STATUS.COMPLETE}'`);
      } else {
        conditions.push(`status != '${STATUS.COMPLETE}'`);
      }
    }

    const search = url.searchParams.get("s");
    if (search) {
      conditions.push("(title LIKE ? OR description LIKE ?)");
      args.push(`%${search}%`, `%${search}%`);
    }

    let sql = `SELECT id, title, description, status, priority, due_date, labels,
                      framework_payload, calendar_sync_state, created_at, updated_at
               FROM tasks`;
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }
    sql += ` ORDER BY ${sortCol} ${order} LIMIT ? OFFSET ?`;
    args.push(perPage, offset);

    const result = await client.execute({ sql, args });

    // Map to Vikunja-compatible schema
    const tasks = result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      const status = String(r.status ?? "");
      const isDone = status === "complete";
      return {
        id: Number(String(r.id).replace(/-/g, "").slice(0, 8)) || 0, // Numeric ID compat
        uid: String(r.id),
        title: String(r.title ?? ""),
        description: String(r.description ?? ""),
        done: isDone,
        done_at: isDone ? new Date(Number(r.updated_at)).toISOString() : null,
        priority: Number(r.priority ?? 0),
        due_date: r.due_date ? String(r.due_date) : null,
        labels: [],
        created: new Date(Number(r.created_at)).toISOString(),
        updated: new Date(Number(r.updated_at)).toISOString(),
        created_by: { id: 1, username: "meitheal" },
      };
    });

    return new Response(JSON.stringify(tasks), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-pagination-total": String(tasks.length),
        "x-pagination-result-count": String(tasks.length),
      },
    });
  } catch (err) {
    logApiError("v1-tasks", "GET failed", err);
    return new Response(JSON.stringify({ error: "Failed to list tasks" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
