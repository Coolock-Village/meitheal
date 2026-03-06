import type { APIRoute } from "astro";
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

export const GET: APIRoute = async () => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();
        const result = await client.execute(
            "SELECT id, title, icon, color, position, created_at, updated_at FROM boards ORDER BY position ASC, created_at ASC"
        );
        return apiJson({ boards: result.rows });
    } catch (e) {
        logger.log("error", {
            event: "api.boards.get.failed",
            domain: "tasks",
            component: "boards-api",
            request_id: crypto.randomUUID(),
            message: e instanceof Error ? e.message : "Unknown error",
        });
        return apiError("Failed to list boards");
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        await ensureSchema();
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const title = stripHtml(String(body.title ?? "").trim());
        if (!title || title.length > 200) {
            return apiError("Title is required and must be 200 characters or less", 400);
        }

        const client = getPersistenceClient();

        // Phase 20 (Security Audit): Limit total boards to prevent abuse
        const countRes = await client.execute("SELECT COUNT(*) as c FROM boards");
        if (Number(countRes.rows[0]?.c || 0) >= 50) {
            return apiError("Maximum board limit (50) reached", 429);
        }

        // Use UUID-based ID to avoid slug collisions (Phase 28 fix)
        const id = `board-${crypto.randomUUID().split("-")[0]}`;
        const icon = String(body.icon ?? "📋").slice(0, 10);
        const color = typeof body.color === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(body.color) ? body.color : "#6366F1";
        const now = Date.now();

        // Get next position
        const maxPos = await client.execute("SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM boards");
        const position = Number(maxPos.rows[0]?.next_pos ?? 0);

        await client.execute({
            sql: "INSERT INTO boards (id, title, icon, color, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [id, title, icon, color, position, now, now],
        });

        return apiJson({ id, title, icon, color, position, created_at: now, updated_at: now }, 201);
    } catch (e) {
        logger.log("error", {
            event: "api.boards.post.failed",
            domain: "tasks",
            component: "boards-api",
            request_id: crypto.randomUUID(),
            message: e instanceof Error ? e.message : "Unknown error",
        });
        return apiError("Failed to create board");
    }
};
