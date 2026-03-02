import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { apiError, apiJson } from "../../../../lib/api-response";
import { formatTicketKey } from "../../../../lib/ticket-key";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
    service: "meitheal-web",
    env: process.env.NODE_ENV ?? "development",
    minLevel: "info",
    enabledCategories: ["tasks", "audit", "observability"],
    redactPatterns: defaultRedactionPatterns,
    auditEnabled: true,
});

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
            return apiError("Task not found", 404);
        }

        const row = source.rows[0] as Record<string, unknown>;
        const newId = crypto.randomUUID();
        const now = Date.now();
        const newTitle = `${String(row.title)} (copy)`;

        // Assign next sequential ticket_number
        const nextNumResult = await client.execute("SELECT COALESCE(MAX(ticket_number), 0) + 1 AS next_num FROM tasks");
        const ticket_number = Number((nextNumResult.rows[0] as Record<string, unknown>)?.next_num ?? 1);

        await client.execute({
            sql: `INSERT INTO tasks (id, title, description, status, priority, due_date, labels,
                               framework_payload, calendar_sync_state, board_id, custom_fields,
                               parent_id, start_date, end_date, progress, color, is_favorite,
                               task_type, time_tracked, ticket_number, idempotency_key, request_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
            args: [
                newId, newTitle, row.description ?? "", "pending", row.priority ?? 3,
                row.due_date ?? null, row.labels ?? "[]", row.framework_payload ?? "{}",
                row.board_id ?? "default", row.custom_fields ?? "{}",
                row.parent_id ?? null, row.start_date ?? null, row.end_date ?? null,
                row.progress ?? 0, row.color ?? null, row.is_favorite ?? 0,
                row.task_type ?? "task",
                ticket_number, crypto.randomUUID(), crypto.randomUUID(), now, now,
            ] as InValue[],
        });

        logger.audit({
            event: "audit.task.duplicated",
            domain: "audit",
            component: "duplicate-api",
            request_id: crypto.randomUUID(),
            task_id: newId,
            message: `Task duplicated from ${sourceId}`,
        });

        return apiJson({
            id: newId,
            ticket_number,
            ticket_key: formatTicketKey(ticket_number),
            title: newTitle,
            source_id: sourceId,
            created_at: now,
        }, 201);
    } catch (err) {
        logger.log("error", {
            event: "api.duplicate.post.failed",
            domain: "tasks",
            component: "duplicate-api",
            request_id: crypto.randomUUID(),
            message: "Internal server error",
        });
        return apiError("Failed to duplicate task");
    }
};
