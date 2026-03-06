import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { apiError, apiJson } from "../../../../lib/api-response";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web", env: process.env.NODE_ENV ?? "development",
  minLevel: "info", enabledCategories: ["tasks"],
  redactPatterns: defaultRedactionPatterns, auditEnabled: false,
});

/**
 * Valid Jira-style link types for task-to-task relationships.
 * Each type has a natural-language inverse used for display:
 *   related_to ↔ related_to
 *   blocked_by ↔ blocks
 *   duplicates ↔ duplicated_by
 */
const LINK_TYPES = ["related_to", "blocked_by", "blocks", "duplicates", "duplicated_by"] as const;
export type LinkType = (typeof LINK_TYPES)[number];

/** Simple UUID-v4 format check (lowercase hex + dashes). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/tasks/:id/links
 *
 * Returns all links for a task (both as source and target).
 *
 * @example Response
 * ```json
 * {
 *   "outbound": [{ "id": "…", "source_task_id": "…", "target_task_id": "…",
 *                   "link_type": "blocks", "created_at": "2026-03-06T…",
 *                   "target_title": "…", "target_task_type": "task",
 *                   "target_ticket_number": 42 }],
 *   "inbound":  [{ … "source_title": "…", "source_task_type": "story" }]
 * }
 * ```
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const taskId = params.id!;

    const outbound = await client.execute({
      sql: `SELECT tl.id, tl.source_task_id, tl.target_task_id, tl.link_type, tl.created_at,
                   t.title AS target_title, t.task_type AS target_task_type, t.ticket_number AS target_ticket_number
            FROM task_links tl
            JOIN tasks t ON t.id = tl.target_task_id
            WHERE tl.source_task_id = ?
            ORDER BY tl.created_at DESC`,
      args: [taskId],
    });

    const inbound = await client.execute({
      sql: `SELECT tl.id, tl.source_task_id, tl.target_task_id, tl.link_type, tl.created_at,
                   t.title AS source_title, t.task_type AS source_task_type, t.ticket_number AS source_ticket_number
            FROM task_links tl
            JOIN tasks t ON t.id = tl.source_task_id
            WHERE tl.target_task_id = ?
            ORDER BY tl.created_at DESC`,
      args: [taskId],
    });

    return apiJson({ outbound: outbound.rows, inbound: inbound.rows });
  } catch (err) {
    logger.log("error", { event: "api.links.get_failed", domain: "tasks", component: "links-api", request_id: "system", message: `GET links failed: ${err}` });
    return apiError("Failed to fetch task links", 500);
  }
};

/**
 * POST /api/tasks/:id/links
 *
 * Create a link between two tasks.
 *
 * @example Request body
 * ```json
 * { "target_task_id": "uuid-here", "link_type": "blocked_by" }
 * ```
 *
 * @example Response (201 Created)
 * ```json
 * { "id": "…", "source_task_id": "…", "target_task_id": "…",
 *   "link_type": "blocked_by", "created_at": "2026-03-06T…", "created": true }
 * ```
 *
 * @example Response (200 Already Exists)
 * ```json
 * { "created": false, "message": "Link already exists" }
 * ```
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const sourceTaskId = params.id!;

    const body = await request.json();
    const { target_task_id, link_type } = body as { target_task_id: string; link_type: string };

    if (!target_task_id || !link_type) {
      return apiError("target_task_id and link_type are required", 400);
    }

    // Validate UUID format (#21 Input Validation)
    if (!UUID_RE.test(target_task_id)) {
      return apiError("target_task_id must be a valid UUID", 400);
    }

    if (!LINK_TYPES.includes(link_type as LinkType)) {
      return apiError(`Invalid link_type. Must be one of: ${LINK_TYPES.join(", ")}`, 400);
    }

    if (sourceTaskId === target_task_id) {
      return apiError("Cannot link a task to itself", 400);
    }

    // Check for existing link (#8 Idempotency)
    const existing = await client.execute({
      sql: `SELECT id FROM task_links
            WHERE source_task_id = ? AND target_task_id = ? AND link_type = ?`,
      args: [sourceTaskId, target_task_id, link_type],
    });

    if (existing.rows.length > 0) {
      return apiJson({ created: false, message: "Link already exists" });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await client.execute({
      sql: `INSERT INTO task_links (id, source_task_id, target_task_id, link_type, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [id, sourceTaskId, target_task_id, link_type, now],
    });

    logger.log("info", { event: "api.links.created", domain: "tasks", component: "links-api", request_id: "system", message: `Created link: ${sourceTaskId} --${link_type}--> ${target_task_id}` });

    return apiJson({ id, source_task_id: sourceTaskId, target_task_id, link_type, created_at: now, created: true }, 201);
  } catch (err) {
    logger.log("error", { event: "api.links.post_failed", domain: "tasks", component: "links-api", request_id: "system", message: `POST link failed: ${err}` });
    return apiError("Failed to create task link", 500);
  }
};

/**
 * DELETE /api/tasks/:id/links?link_id=xxx
 *
 * Remove a link. Uses query parameter (not JSON body) for proxy compatibility.
 * Validates that the link belongs to the task specified in the URL (#22 Authorization).
 *
 * @example DELETE /api/tasks/abc-123/links?link_id=def-456
 * @example Response: `{ "deleted": true }`
 */
export const DELETE: APIRoute = async ({ params, url }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const taskId = params.id!;

    const link_id = url.searchParams.get("link_id");

    if (!link_id) {
      return apiError("link_id query parameter is required", 400);
    }

    // Scope check: link must belong to this task (#22 Authorization)
    const result = await client.execute({
      sql: "DELETE FROM task_links WHERE id = ? AND (source_task_id = ? OR target_task_id = ?)",
      args: [link_id, taskId, taskId],
    });

    if (result.rowsAffected === 0) {
      return apiError("Link not found or does not belong to this task", 404);
    }

    logger.log("info", { event: "api.links.deleted", domain: "tasks", component: "links-api", request_id: "system", message: `Deleted link=${link_id} from task=${taskId}` });

    return apiJson({ deleted: true });
  } catch (err) {
    logger.log("error", { event: "api.links.delete_failed", domain: "tasks", component: "links-api", request_id: "system", message: `DELETE link failed: ${err}` });
    return apiError("Failed to delete task link", 500);
  }
};
