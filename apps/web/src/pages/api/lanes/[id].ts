import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { stripHtml } from "../../../lib/strip-html";
import { apiError, apiJson } from "../../../lib/api-response";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["tasks", "audit", "observability"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: true,
});

/** PUT /api/lanes/[id], DELETE /api/lanes/[id] */

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const existing = await client.execute({
      sql: "SELECT id, built_in FROM kanban_lanes WHERE id = ? LIMIT 1",
      args: [params.id!],
    });
    if (existing.rows.length === 0) {
      return apiError("Lane not found", 404);
    }

    const now = Date.now();
    const updates: string[] = [];
    const args: InValue[] = [];

    if (typeof body.label === "string") {
      const label = stripHtml(body.label.trim());
      if (!label || label.length < 1 || label.length > 50) {
        return apiError("label must be 1-50 characters", 400);
      }
      updates.push("label = ?");
      args.push(label);
    }
    if (typeof body.icon === "string") {
      updates.push("icon = ?");
      args.push(body.icon.slice(0, 4));
    }
    if (typeof body.position === "number") {
      updates.push("position = ?");
      args.push(Math.max(0, Math.round(body.position)));
    }
    if (typeof body.wip_limit === "number") {
      updates.push("wip_limit = ?");
      args.push(Math.max(0, Math.round(body.wip_limit)));
    }
    if (typeof body.includes === "string") {
      try {
        const parsed = JSON.parse(body.includes);
        if (Array.isArray(parsed)) {
          updates.push("includes = ?");
          args.push(body.includes);
        }
      } catch { /* skip invalid JSON */ }
    }

    if (updates.length === 0) {
      return apiError("No fields to update", 400);
    }

    updates.push("updated_at = ?");
    args.push(now);
    args.push(params.id!);

    await client.execute({
      sql: `UPDATE kanban_lanes SET ${updates.join(", ")} WHERE id = ?`,
      args,
    });

    const updated = await client.execute({
      sql: "SELECT id, key, label, icon, position, wip_limit, includes, built_in, created_at, updated_at FROM kanban_lanes WHERE id = ? LIMIT 1",
      args: [params.id!],
    });

    const row = updated.rows[0] as Record<string, unknown>;
    return apiJson({
      id: row.id,
      key: row.key,
      label: row.label,
      icon: row.icon,
      position: Number(row.position ?? 0),
      wip_limit: Number(row.wip_limit ?? 0),
      includes: typeof row.includes === "string" ? JSON.parse(String(row.includes)) : [],
      builtIn: Number(row.built_in ?? 0) === 1,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (err) {
    logger.log("error", {
      event: "api.lanes.put.failed",
      domain: "tasks",
      component: "lanes-api",
      request_id: crypto.randomUUID(),
      message: err instanceof Error ? err.message : "Unknown error",
    });
    return apiError("Failed to update lane");
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();

    const existing = await client.execute({
      sql: "SELECT id, built_in, key FROM kanban_lanes WHERE id = ? LIMIT 1",
      args: [params.id!],
    });
    if (existing.rows.length === 0) {
      return apiError("Lane not found", 404);
    }

    const row = existing.rows[0] as Record<string, unknown>;
    if (Number(row.built_in ?? 0) === 1) {
      return apiError("Cannot delete built-in lane", 403);
    }

    // Move tasks in this lane's status back to "pending"
    const key = String(row.key);
    await client.execute({
      sql: "UPDATE tasks SET status = 'pending', updated_at = ? WHERE status = ?",
      args: [Date.now(), key],
    });

    await client.execute({ sql: "DELETE FROM kanban_lanes WHERE id = ?", args: [params.id!] });

    return apiJson({ deleted: true, tasksReassigned: key });
  } catch (err) {
    logger.log("error", {
      event: "api.lanes.delete.failed",
      domain: "tasks",
      component: "lanes-api",
      request_id: crypto.randomUUID(),
      message: err instanceof Error ? err.message : "Unknown error",
    });
    return apiError("Failed to delete lane");
  }
};
