import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

/**
 * Export Tasks as JSON
 *
 * Downloads all server-side tasks as a formatted JSON file.
 * Filename format: meitheal-tasks-YYYY-MM-DD.json
 */
export const GET: APIRoute = async () => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();

        // Explicit column list to avoid leaking internal schema changes
        const result = await client.execute(
            `SELECT id, title, description, status, priority, due_date, labels,
                    framework_payload, calendar_sync_state, board_id, custom_fields,
                    parent_id, time_tracked, start_date, end_date, progress, color,
                    is_favorite, task_type, created_at, updated_at
             FROM tasks ORDER BY updated_at DESC`
        );
        const allTasks = result.rows;

        // Generate JSON payload
        const dataStr = JSON.stringify(allTasks, null, 2);

        // Send as downloadable file
        return new Response(dataStr, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="meitheal-tasks-${new Date().toISOString().split("T")[0]}.json"`,
                "X-Content-Type-Options": "nosniff"
            }
        });
    } catch (error) {
        console.error("Failed to export tasks as JSON:", error);
        return new Response(JSON.stringify({ error: "Export failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
