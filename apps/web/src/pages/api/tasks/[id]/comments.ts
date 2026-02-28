import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { stripHtml } from "../../../../lib/strip-html";

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

        return new Response(JSON.stringify({ comments: result.rows }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err) {
        console.error("[comments] GET failed:", err);
        return new Response(JSON.stringify({ error: "Failed to load comments" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
};

export const POST: APIRoute = async ({ params, request }) => {
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
        return new Response(JSON.stringify({ error: "Task not found" }), {
            status: 404,
            headers: { "content-type": "application/json" },
        });
    }

    // Validate content
    const rawContent = typeof body.content === "string" ? body.content.trim() : "";
    const content = stripHtml(rawContent); // Recursive XSS prevention
    if (!content) {
        return new Response(JSON.stringify({ error: "content is required" }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }
    if (content.length > 5000) {
        return new Response(JSON.stringify({ error: "content must be 5000 characters or less" }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    const author = typeof body.author === "string" ? stripHtml(body.author.trim()).slice(0, 100) : "user";

    await client.execute({
        sql: "INSERT INTO comments (task_id, content, author) VALUES (?, ?, ?)",
        args: [taskId!, content, author] as InValue[],
    });

    // Return newly created comment
    const latest = await client.execute({
        sql: "SELECT id, task_id, content, author, created_at FROM comments WHERE task_id = ? ORDER BY id DESC LIMIT 1",
        args: [taskId!] as InValue[],
    });

    return new Response(JSON.stringify(latest.rows[0]), {
        status: 201,
        headers: { "content-type": "application/json" },
    });
};
