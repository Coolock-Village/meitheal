import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { stripHtml } from "../../../lib/strip-html";
import { apiError, apiJson } from "../../../lib/api-response";
import { validateUuid } from "../../../lib/validation";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
    service: "meitheal-web",
    env: process.env.NODE_ENV ?? "development",
    minLevel: "info",
    enabledCategories: ["tasks", "audit", "observability"],
    redactPatterns: defaultRedactionPatterns,
    auditEnabled: true,
});

export const PUT: APIRoute = async ({ params, request }) => {
    try {
        await ensureSchema();
        const id = params.id;
        if (!id) {
            return apiError("Board ID required", 400);
        }
        const uuidErr = validateUuid(id, "board_id");
        if (uuidErr && id !== "default") {
            return apiError(uuidErr, 400);
        }

        const client = getPersistenceClient();
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const updates: string[] = [];
        const args: (string | number)[] = [];

        if (body.title !== undefined) { const t = stripHtml(String(body.title).trim()); if (t && t.length <= 200) { updates.push("title = ?"); args.push(t); } }
        if (body.icon !== undefined) { updates.push("icon = ?"); args.push(String(body.icon).slice(0, 10)); }
        if (body.color !== undefined) { const c = String(body.color); if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)) { updates.push("color = ?"); args.push(c); } }
        if (body.position !== undefined) { updates.push("position = ?"); args.push(Number(body.position)); }

        if (updates.length === 0) {
            return apiError("No fields to update", 400);
        }

        updates.push("updated_at = ?");
        args.push(Date.now());
        args.push(id);

        await client.execute({
            sql: `UPDATE boards SET ${updates.join(", ")} WHERE id = ?`,
            args,
        });

        return apiJson({ ok: true });
    } catch (e: unknown) {
        logger.log("error", {
            event: "api.boards.put.failed",
            domain: "tasks",
            component: "boards-api",
            request_id: crypto.randomUUID(),
            message: e instanceof Error ? e.message : "Unknown error",
        });
        return apiError("Failed to update board");
    }
};

export const DELETE: APIRoute = async ({ params }) => {
    try {
        await ensureSchema();
        const id = params.id;
        if (!id || id === "default") {
            return apiError("Cannot delete default board", 400);
        }

        const client = getPersistenceClient();

        // Move tasks from deleted board to default
        await client.execute({
            sql: "UPDATE tasks SET board_id = 'default' WHERE board_id = ?",
            args: [id],
        });

        await client.execute({
            sql: "DELETE FROM boards WHERE id = ?",
            args: [id],
        });

        return apiJson({ ok: true, moved_to: "default" });
    } catch (e: unknown) {
        logger.log("error", {
            event: "api.boards.delete.failed",
            domain: "tasks",
            component: "boards-api",
            request_id: crypto.randomUUID(),
            message: e instanceof Error ? e.message : "Unknown error",
        });
        return apiError("Failed to delete board");
    }
};
