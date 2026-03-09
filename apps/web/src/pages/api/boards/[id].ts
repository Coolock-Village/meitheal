import type { APIRoute } from "astro"
import type { InValue } from "@libsql/client"
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store"
import { BoardRepository } from "@domains/tasks/persistence/board-repository"
import { stripHtml } from "../../../lib/strip-html"
import { apiError, apiJson } from "../../../lib/api-response"
import { validateUuid } from "../../../lib/validation"
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability"

const logger = createLogger({
    service: "meitheal-web",
    env: process.env.NODE_ENV ?? "development",
    minLevel: "info",
    enabledCategories: ["tasks", "audit", "observability"],
    redactPatterns: defaultRedactionPatterns,
    auditEnabled: true,
})

export const PUT: APIRoute = async ({ params, request }) => {
    try {
        await ensureSchema()
        const id = params.id
        if (!id) {
            return apiError("Board ID required", 400)
        }
        const uuidErr = validateUuid(id, "board_id")
        if (uuidErr && id !== "default") {
            return apiError(uuidErr, 400)
        }

        const repo = new BoardRepository(getPersistenceClient())
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const fields: Record<string, InValue> = {}

        if (body.title !== undefined) { const t = stripHtml(String(body.title).trim()); if (t && t.length <= 200) { fields.title = t } }
        if (body.icon !== undefined) { fields.icon = String(body.icon).slice(0, 10) }
        if (body.color !== undefined) { const c = String(body.color); if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)) { fields.color = c } }
        if (body.position !== undefined) { fields.position = Number(body.position) }

        if (Object.keys(fields).length === 0) {
            return apiError("No fields to update", 400)
        }

        await repo.update(id, fields)
        return apiJson({ ok: true })
    } catch (e: unknown) {
        logger.log("error", {
            event: "api.boards.put.failed",
            domain: "tasks",
            component: "boards-api",
            request_id: crypto.randomUUID(),
            message: e instanceof Error ? e.message : "Unknown error",
        })
        return apiError("Failed to update board")
    }
}

export const DELETE: APIRoute = async ({ params }) => {
    try {
        await ensureSchema()
        const id = params.id
        if (!id || id === "default") {
            return apiError("Cannot delete default board", 400)
        }

        const repo = new BoardRepository(getPersistenceClient())
        await repo.delete(id)

        return apiJson({ ok: true, moved_to: "default" })
    } catch (e: unknown) {
        logger.log("error", {
            event: "api.boards.delete.failed",
            domain: "tasks",
            component: "boards-api",
            request_id: crypto.randomUUID(),
            message: e instanceof Error ? e.message : "Unknown error",
        })
        return apiError("Failed to delete board")
    }
}
