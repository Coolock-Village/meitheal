import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

export const GET: APIRoute = async () => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();
        // Explicit column list (mirrors JSON export)
        const result = await client.execute(
            `SELECT id, title, description, status, priority, due_date, labels,
                    framework_payload, calendar_sync_state, board_id, custom_fields,
                    parent_id, time_tracked, start_date, end_date, progress, color,
                    is_favorite, task_type, created_at, updated_at
             FROM tasks ORDER BY updated_at DESC`
        );
        const allTasks = result.rows;

        if (allTasks.length === 0) {
            // Return CSV with headers only (204 should not have a body)
            return new Response("id,parent_id,title,description,status,priority,task_type,due_date,created_at,updated_at\n", {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="meitheal-tasks-${new Date().toISOString().split("T")[0]}.csv"`
                }
            });
        }

        const headers = [
            "id", "parent_id", "title", "description", "status", "priority",
            "task_type", "due_date", "created_at", "updated_at"
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
            escapeCsv(t.id),
            escapeCsv(t.parent_id),
            escapeCsv(t.title),
            escapeCsv(t.description),
            escapeCsv(t.status),
            escapeCsv(t.priority),
            escapeCsv(t.task_type),
            escapeCsv(t.due_date),
            escapeCsv(t.created_at),
            escapeCsv(t.updated_at)
        ].join(","));

        const csvContent = [headers.join(","), ...rows].join("\n");

        return new Response(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="meitheal-tasks-${new Date().toISOString().split("T")[0]}.csv"`
            }
        });
    } catch (error) {
        console.error("Failed to export tasks as CSV:", error);
        return new Response(JSON.stringify({ error: "Export failed" }), { status: 500, headers: { "content-type": "application/json" } });
    }
};
