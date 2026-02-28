import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

/**
 * GET /api/tasks/[id]/activity — Task activity log (audit trail)
 * Returns field-level change history for a task.
 * Competitive parity: Jira, Asana, Linear all show activity logs.
 */
export const GET: APIRoute = async ({ params }) => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();

        const result = await client.execute({
            sql: `SELECT id, task_id, field, old_value, new_value, actor, created_at
            FROM task_activity_log
            WHERE task_id = ?
            ORDER BY created_at DESC
            LIMIT 100`,
            args: [params.id!],
        });

        return new Response(JSON.stringify(result.rows), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err) {
        console.error("[activity] GET failed:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch activity" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
};
