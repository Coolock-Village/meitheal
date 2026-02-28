import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

export const GET: APIRoute = async () => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();
        const result = await client.execute(
            "SELECT id, title, icon, color, position, created_at, updated_at FROM boards ORDER BY position ASC, created_at ASC"
        );
        return new Response(JSON.stringify({ boards: result.rows }), {
            headers: { "content-type": "application/json" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Failed to list boards" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        await ensureSchema();
        const body = await request.json();
        const title = String(body.title ?? "").trim().replace(/<[^>]*>/g, "");
        if (!title || title.length > 200) {
            return new Response(JSON.stringify({ error: "Title is required" }), {
                status: 400,
                headers: { "content-type": "application/json" },
            });
        }

        const client = getPersistenceClient();
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
        const icon = String(body.icon ?? "📋").slice(0, 10);
        const color = typeof body.color === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(body.color) ? body.color : "#10b981";
        const now = Date.now();

        // Get next position
        const maxPos = await client.execute("SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM boards");
        const position = Number(maxPos.rows[0]?.next_pos ?? 0);

        await client.execute({
            sql: "INSERT INTO boards (id, title, icon, color, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [id, title, icon, color, position, now, now],
        });

        return new Response(
            JSON.stringify({ id, title, icon, color, position, created_at: now, updated_at: now }),
            { status: 201, headers: { "content-type": "application/json" } }
        );
    } catch (e) {
        return new Response(JSON.stringify({ error: "Failed to create board" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
};
