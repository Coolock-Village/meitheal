import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

/** Known safe setting keys — only these will be imported */
const ALLOWED_KEYS = new Set([
    "ha-url", "ha-token", "vikunja-url", "vikunja-token",
    "default-board", "theme", "default-view", "wip-limit",
    "ai-provider", "ai-custom-url", "show-description", "column-order",
    "enable-notifications", "notification-sound", "notification-vibrate", "calendar-entity"
]);

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return new Response("Invalid settings payload format. Expected a key-value object.", { status: 400 });
        }

        await ensureSchema();
        const client = getPersistenceClient();

        // Batch all upserts inside a single transaction for atomicity
        const statements = [];
        for (const [key, value] of Object.entries(data)) {
            if (typeof key !== "string" || value === null || value === undefined) {
                continue;
            }
            if (!ALLOWED_KEYS.has(key)) {
                console.warn(`[import/settings] Rejected unknown key: ${key}`);
                continue;
            }

            const stringValue = typeof value === "string" ? value : JSON.stringify(value);
            statements.push({
                sql: `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
                args: [key, stringValue]
            });
        }

        if (statements.length === 0) {
            return new Response(JSON.stringify({ success: false, message: "No valid settings found in payload." }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Execute all in a single batch for performance (P4 fix)
        await client.batch(statements);

        return new Response(JSON.stringify({ success: true, message: `${statements.length} settings imported successfully.` }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Failed to import settings:", error);
        return new Response("Import failed: payload could not be processed.", { status: 500 });
    }
};
