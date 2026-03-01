import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { exportFilename } from "../../../lib/export-filename";

export const GET: APIRoute = async () => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();

        // Fetch all true server-side settings
        const result = await client.execute("SELECT * FROM settings");

        // Convert array of rows into a key-value object
        const settingsObject: Record<string, string> = {};
        for (const row of result.rows) {
            if (row.key && row.value !== null) {
                settingsObject[row.key as string] = row.value as string;
            }
        }

        // Generate JSON payload
        const dataStr = JSON.stringify(settingsObject, null, 2);

        // Send as downloadable file
        return new Response(dataStr, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${exportFilename("Settings", "json")}"`
            }
        });

    } catch (error) {
        console.error("Failed to export settings as JSON:", error);
        return new Response(JSON.stringify({ error: "Settings Export failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
