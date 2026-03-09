import type { APIRoute } from "astro"
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store"
import { BoardRepository } from "@domains/tasks/persistence/board-repository"
import { stripHtml } from "../../../lib/strip-html"
import { apiError, apiJson } from "../../../lib/api-response"
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability"

const logger = createLogger({
    service: "meitheal-web",
    env: process.env.NODE_ENV ?? "development",
    minLevel: "info",
    enabledCategories: ["tasks", "audit", "observability"],
    redactPatterns: defaultRedactionPatterns,
    auditEnabled: true,
})

export const GET: APIRoute = async () => {
    try {
        await ensureSchema()
        const repo = new BoardRepository(getPersistenceClient())
        const boards = await repo.findAll()
        return apiJson({ boards })
    } catch (e: unknown) {
        logger.log("error", {
            event: "api.boards.get.failed",
            domain: "tasks",
            component: "boards-api",
            request_id: crypto.randomUUID(),
            message: e instanceof Error ? e.message : "Unknown error",
        })
        return apiError("Failed to list boards")
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        await ensureSchema()
        const repo = new BoardRepository(getPersistenceClient())
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const title = stripHtml(String(body.title ?? "").trim())
        if (!title || title.length > 200) {
            return apiError("Title is required and must be 200 characters or less", 400)
        }

        if (await repo.count() >= 50) {
            return apiError("Maximum board limit (50) reached", 429)
        }

        const id = `board-${crypto.randomUUID().split("-")[0]}`
        const icon = String(body.icon ?? "📋").slice(0, 10)
        const color = typeof body.color === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(body.color) ? body.color : "#6366F1"
        const position = await repo.getNextPosition()

        await repo.create({ id, title, icon, color, position })

        const now = Date.now()
        return apiJson({ id, title, icon, color, position, created_at: now, updated_at: now }, 201)
    } catch (e: unknown) {
        logger.log("error", {
            event: "api.boards.post.failed",
            domain: "tasks",
            component: "boards-api",
            request_id: crypto.randomUUID(),
            message: e instanceof Error ? e.message : "Unknown error",
        })
        return apiError("Failed to create board")
    }
}
