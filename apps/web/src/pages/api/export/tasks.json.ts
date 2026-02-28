import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

export const GET: APIRoute = async () => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();

        // Fetch all true server-side tasks
        const result = await client.execute("SELECT * FROM tasks ORDER BY updated_at DESC");
        const allTasks = result.rows;

        // Generate JSON payload
        const dataStr = JSON.stringify(allTasks, null, 2);

        // Send as downloadable file
        return new Response(dataStr, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="meitheal-tasks-${new Date().toISOString().split("T")[0]}.json"`
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
