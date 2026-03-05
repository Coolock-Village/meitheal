import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { exportFilename } from "../../../lib/export-filename";
import { logApiError } from "../../../lib/api-logger";

export const GET: APIRoute = async () => {
    try {
        await ensureSchema();
        const client = getPersistenceClient();

        // Fetch all true server-side settings
        const result = await client.execute("SELECT * FROM settings");

        // Secrets that MUST NOT be exported
        const EXCLUDED_KEYS = new Set([
            "caldav_password_enc",
            "ha_token",
            "n8n_api_key",
            "n8n_signing_secret",
            "webhook_secret",
            "grocy_api_key",
        ]);

        // Convert array of rows into a key-value object, excluding secrets
        const settingsObject: Record<string, string> = {};
        for (const row of result.rows) {
            if (row.key && row.value !== null && !EXCLUDED_KEYS.has(row.key as string)) {
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
        logApiError("export-settings", "Failed to export settings as JSON", error);
        return new Response(JSON.stringify({ error: "Settings Export failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
