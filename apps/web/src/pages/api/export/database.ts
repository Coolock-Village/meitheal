import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";

export const GET: APIRoute = async () => {
    try {
        const dbPath = process.env.MEITHEAL_DB_URL
            ? process.env.MEITHEAL_DB_URL.replace(/^file:/, "")
            : "./.data/meitheal.db";

        const absolutePath = path.isAbsolute(dbPath)
            ? dbPath
            : path.join(process.cwd(), dbPath);

        const stat = await fs.stat(absolutePath);
        const file = await fs.readFile(absolutePath);

        return new Response(file, {
            status: 200,
            headers: {
                "Content-Type": "application/x-sqlite3",
                "Content-Disposition": `attachment; filename="meitheal-backup-${new Date().toISOString().split("T")[0]}.sqlite"`,
                "Content-Length": stat.size.toString(),
            },
        });
    } catch (err) {
        console.error("Database export failed:", err);
        return new Response(JSON.stringify({ error: "Failed to read database file." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
