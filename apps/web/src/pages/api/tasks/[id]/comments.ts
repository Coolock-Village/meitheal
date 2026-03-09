import type { APIRoute } from "astro"
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store"
import { TaskRepository } from "@domains/tasks/persistence/task-repository"
import { sanitize } from "../../../../lib/sanitize"
import { apiError, apiJson } from "../../../../lib/api-response"
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability"

const logger = createLogger({
    service: "meitheal-web",
    env: process.env.NODE_ENV ?? "development",
    minLevel: "info",
    enabledCategories: ["tasks", "audit", "observability"],
    redactPatterns: defaultRedactionPatterns,
    auditEnabled: true,
})

/** GET /api/tasks/[id]/comments — list comments, POST — add comment */

export const GET: APIRoute = async ({ params }) => {
    try {
        await ensureSchema()
        const repo = new TaskRepository(getPersistenceClient())
        const comments = await repo.getComments(params.id!)
        return apiJson({ comments })
    } catch (err) {
        logger.log("error", {
            event: "api.comments.get.failed",
            domain: "tasks",
            component: "comments-api",
            request_id: crypto.randomUUID(),
            message: "Internal server error",
        })
        return apiError("Failed to load comments")
    }
}

export const POST: APIRoute = async ({ params, request }) => {
    try {
        await ensureSchema()
        const repo = new TaskRepository(getPersistenceClient())
        const taskId = params.id!
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

        // Validate task exists
        if (!(await repo.taskExists(taskId))) {
            return apiError("Task not found", 404)
        }

        // Validate content
        const rawContent = typeof body.content === "string" ? body.content.trim() : ""
        const content = sanitize(rawContent)
        if (!content) {
            return apiError("content is required", 400)
        }
        if (content.length > 5000) {
            return apiError("content must be 5000 characters or less", 400)
        }

        const author = typeof body.author === "string" ? sanitize(body.author.trim()).slice(0, 100) : "user"

        const comment = await repo.addComment(taskId, content, author)
        return apiJson(comment, 201)
    } catch (err) {
        logger.log("error", {
            event: "api.comments.post.failed",
            domain: "tasks",
            component: "comments-api",
            request_id: crypto.randomUUID(),
            message: "Internal server error",
        })
        return apiError("Failed to create comment")
    }
}
