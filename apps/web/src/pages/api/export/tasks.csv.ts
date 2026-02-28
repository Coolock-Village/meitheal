import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

export const GET: APIRoute = async () => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();

        const result = await client.execute("SELECT * FROM tasks ORDER BY updated_at DESC");
        const allTasks = result.rows;

        if (allTasks.length === 0) {
            return new Response("No tasks to export.", { status: 204 });
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
        return new Response("Export failed", { status: 500 });
    }
};
