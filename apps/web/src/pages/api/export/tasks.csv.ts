import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { formatTicketKey } from "../../../lib/ticket-key";
import { exportFilename } from "../../../lib/export-filename";
import { logApiError } from "../../../lib/api-logger";

export const GET: APIRoute = async () => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();
        // Explicit column list (mirrors JSON export)
        const result = await client.execute(
            `SELECT id, title, description, status, priority, due_date, labels,
                    framework_payload, calendar_sync_state, board_id, custom_fields,
                    parent_id, time_tracked, start_date, end_date, progress, color,
                    is_favorite, task_type, ticket_number, recurrence_rule,
                    checklists, reminder_at, created_at, updated_at
             FROM tasks ORDER BY updated_at DESC`
        );
        const allTasks = result.rows;

        if (allTasks.length === 0) {
            // Return CSV with headers only (204 should not have a body)
            return new Response("ticket_key,id,parent_id,title,description,status,priority,task_type,board_id,labels,due_date,created_at,updated_at\n", {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${exportFilename("Tasks", "csv")}"`
                }
            });
        }

        const headers = [
            "ticket_key", "id", "parent_id", "title", "description", "status", "priority",
            "task_type", "board_id", "labels", "due_date", "recurrence_rule",
            "checklists", "reminder_at", "created_at", "updated_at"
        ];

        const escapeCsv = (val: unknown) => {
            if (val === null || val === undefined) return '""';
            const str = String(val);
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return `"${str}"`;
        };

        const rows = allTasks.map(t => [
            escapeCsv(formatTicketKey(t.ticket_number != null ? Number(t.ticket_number) : null)),
            escapeCsv(t.id),
            escapeCsv(t.parent_id),
            escapeCsv(t.title),
            escapeCsv(t.description),
            escapeCsv(t.status),
            escapeCsv(t.priority),
            escapeCsv(t.task_type),
            escapeCsv(t.board_id),
            escapeCsv(t.labels),
            escapeCsv(t.due_date),
            escapeCsv(t.recurrence_rule),
            escapeCsv(t.checklists),
            escapeCsv(t.reminder_at),
            escapeCsv(t.created_at),
            escapeCsv(t.updated_at)
        ].join(","));

        // BOM for Excel UTF-8 compatibility
        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");

        return new Response(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${exportFilename("Tasks", "csv")}"`
            }
        });
    } catch (error) {
        logApiError("export-tasks-csv", "Failed to export tasks as CSV", error);
        return new Response(JSON.stringify({ error: "Export failed" }), { status: 500, headers: { "content-type": "application/json" } });
    }
};
