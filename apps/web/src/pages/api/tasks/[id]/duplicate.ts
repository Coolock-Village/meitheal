import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

/**
 * POST /api/tasks/[id]/duplicate — Clone a task with a new ID.
 * Competitive parity: Jira, Asana, Linear all have "Clone/Duplicate" actions.
 * Copies all fields except id, created_at, updated_at, and calendar_sync_state.
 */
export const POST: APIRoute = async ({ params }) => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();
        const sourceId = params.id!;

        // Fetch source task
        const source = await client.execute({
            sql: `SELECT title, description, status, priority, due_date, labels,
                   framework_payload, board_id, custom_fields, parent_id,
                   start_date, end_date, progress, color, is_favorite,
                   task_type, time_tracked
            FROM tasks WHERE id = ? LIMIT 1`,
            args: [sourceId],
        });

        if (source.rows.length === 0) {
            return new Response(JSON.stringify({ error: "Task not found" }), {
                status: 404,
                headers: { "content-type": "application/json" },
            });
        }

        const row = source.rows[0] as Record<string, unknown>;
        const newId = crypto.randomUUID();
        const now = Date.now();
        const newTitle = `${String(row.title)} (copy)`;

        await client.execute({
            sql: `INSERT INTO tasks (id, title, description, status, priority, due_date, labels,
                               framework_payload, calendar_sync_state, board_id, custom_fields,
                               parent_id, start_date, end_date, progress, color, is_favorite,
                               task_type, time_tracked, idempotency_key, request_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
            args: [
                newId, newTitle, row.description ?? "", "pending", row.priority ?? 3,
                row.due_date ?? null, row.labels ?? "[]", row.framework_payload ?? "{}",
                row.board_id ?? "default", row.custom_fields ?? "{}",
                row.parent_id ?? null, row.start_date ?? null, row.end_date ?? null,
                row.progress ?? 0, row.color ?? null, row.is_favorite ?? 0,
                row.task_type ?? "task",
                crypto.randomUUID(), crypto.randomUUID(), now, now,
            ] as InValue[],
        });

        return new Response(JSON.stringify({
            id: newId,
            title: newTitle,
            source_id: sourceId,
            created_at: now,
        }), {
            status: 201,
            headers: { "content-type": "application/json" },
        });
    } catch (err) {
        console.error("[duplicate] POST failed:", err);
        return new Response(JSON.stringify({ error: "Failed to duplicate task" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
};
