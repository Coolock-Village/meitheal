import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return new Response("Invalid settings payload format. Expected a key-value object.", { status: 400 });
        }

        await ensureSchema();
        const client = getPersistenceClient();

        // Iterate through imported keys and upsert them into the settings table
        for (const [key, value] of Object.entries(data)) {
            if (typeof key !== "string" || value === null || value === undefined) {
                continue;
            }

            const stringValue = typeof value === "string" ? value : JSON.stringify(value);

            await client.execute({
                sql: `
              INSERT INTO settings (key, value)
              VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value
            `,
                args: [key, stringValue]
            });
        }

        return new Response(JSON.stringify({ success: true, message: "Settings imported successfully." }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Failed to import settings:", error);
        return new Response("Import failed: payload could not be processed.", { status: 500 });
    }
};
