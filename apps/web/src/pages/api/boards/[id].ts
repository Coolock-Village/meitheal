import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

export const PUT: APIRoute = async ({ params, request }) => {
    try {
        await ensureSchema();
        const id = params.id;
        if (!id) {
            return new Response(JSON.stringify({ error: "Board ID required" }), {
                status: 400,
                headers: { "content-type": "application/json" },
            });
        }

        const client = getPersistenceClient();
        const body = await request.json();
        const updates: string[] = [];
        const args: (string | number)[] = [];

        if (body.title !== undefined) { updates.push("title = ?"); args.push(String(body.title)); }
        if (body.icon !== undefined) { updates.push("icon = ?"); args.push(String(body.icon)); }
        if (body.color !== undefined) { updates.push("color = ?"); args.push(String(body.color)); }
        if (body.position !== undefined) { updates.push("position = ?"); args.push(Number(body.position)); }

        if (updates.length === 0) {
            return new Response(JSON.stringify({ error: "No fields to update" }), {
                status: 400,
                headers: { "content-type": "application/json" },
            });
        }

        updates.push("updated_at = ?");
        args.push(Date.now());
        args.push(id);

        await client.execute({
            sql: `UPDATE boards SET ${updates.join(", ")} WHERE id = ?`,
            args,
        });

        return new Response(JSON.stringify({ ok: true }), {
            headers: { "content-type": "application/json" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Failed to update board" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
};

export const DELETE: APIRoute = async ({ params }) => {
    try {
        await ensureSchema();
        const id = params.id;
        if (!id || id === "default") {
            return new Response(JSON.stringify({ error: "Cannot delete default board" }), {
                status: 400,
                headers: { "content-type": "application/json" },
            });
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

        return new Response(JSON.stringify({ ok: true, moved_to: "default" }), {
            headers: { "content-type": "application/json" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Failed to delete board" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
};
