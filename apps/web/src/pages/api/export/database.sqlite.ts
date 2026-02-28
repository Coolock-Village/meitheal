import type { APIRoute } from "astro";
import { readFileSync, existsSync } from "fs";
import path from "path";

export const GET: APIRoute = async () => {
    try {
        // Resolve DB path - matching the store.ts resolveDbUrl output for the file approach
        const dbUrl = process.env.MEITHEAL_DB_URL ?? "file:./.data/meitheal.db";
        if (!dbUrl.startsWith("file:")) {
            return new Response("Database is not file-based (Remote connection). Extraction unavailable.", { status: 400 });
        }

        const dbPath = dbUrl.slice("file:".length);
        const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

        if (!existsSync(absolutePath)) {
            return new Response("Database file not found on server.", { status: 404 });
        }

        // Read the binary sqlite file to a buffer
        const buffer = readFileSync(absolutePath);

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/x-sqlite3",
                "Content-Disposition": `attachment; filename="meitheal-${new Date().toISOString().split("T")[0]}.db"`,
                "Content-Length": buffer.length.toString()
            }
        });

    } catch (error) {
        console.error("Failed to export database:", error);
        return new Response("Export failed", { status: 500 });
    }
};
