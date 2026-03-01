import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { sanitize } from "../../../../lib/sanitize";
import { apiError, apiJson } from "../../../../lib/api-response";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
    service: "meitheal-web",
    env: process.env.NODE_ENV ?? "development",
    minLevel: "info",
    enabledCategories: ["tasks", "audit", "observability"],
    redactPatterns: defaultRedactionPatterns,
    auditEnabled: true,
});

/** GET /api/tasks/[id]/comments — list comments, POST — add comment */

export const GET: APIRoute = async ({ params }) => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();
        const taskId = params.id;

        const result = await client.execute({
            sql: "SELECT id, task_id, content, author, created_at FROM comments WHERE task_id = ? ORDER BY created_at ASC",
            args: [taskId!] as InValue[],
        });

        return apiJson({ comments: result.rows });
    } catch (err) {
        logger.log("error", {
            event: "api.comments.get.failed",
            domain: "tasks",
            component: "comments-api",
            request_id: crypto.randomUUID(),
            message: err instanceof Error ? err.message : "Unknown error",
        });
        return apiError("Failed to load comments");
    }
};

export const POST: APIRoute = async ({ params, request }) => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();
        const taskId = params.id;
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

        // Validate task exists
        const task = await client.execute({
            sql: "SELECT id FROM tasks WHERE id = ? LIMIT 1",
            args: [taskId!] as InValue[],
        });
        if (task.rows.length === 0) {
            return apiError("Task not found", 404);
        }

        // Validate content
        const rawContent = typeof body.content === "string" ? body.content.trim() : "";
        const content = sanitize(rawContent);
        if (!content) {
            return apiError("content is required", 400);
        }
        if (content.length > 5000) {
            return apiError("content must be 5000 characters or less", 400);
        }

        const author = typeof body.author === "string" ? sanitize(body.author.trim()).slice(0, 100) : "user";

        await client.execute({
            sql: "INSERT INTO comments (task_id, content, author) VALUES (?, ?, ?)",
            args: [taskId!, content, author] as InValue[],
        });

        // Return newly created comment
        const latest = await client.execute({
            sql: "SELECT id, task_id, content, author, created_at FROM comments WHERE task_id = ? ORDER BY id DESC LIMIT 1",
            args: [taskId!] as InValue[],
        });

        return apiJson(latest.rows[0], 201);
    } catch (err) {
        logger.log("error", {
            event: "api.comments.post.failed",
            domain: "tasks",
            component: "comments-api",
            request_id: crypto.randomUUID(),
            message: err instanceof Error ? err.message : "Unknown error",
        });
        return apiError("Failed to create comment");
    }
};
