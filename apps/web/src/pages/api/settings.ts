import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

/**
 * Settings API — persists user preferences (framework scoring config, etc.)
 * Stores key-value pairs in a `settings` table.
 * Per user request: PM frameworks should be configurable (enable/disable/editable).
 */

async function ensureSettingsTable() {
  await ensureSchema();
  const client = getPersistenceClient();
  await client.execute(
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`
  );
}

export const GET: APIRoute = async ({ url }) => {
  try {
    await ensureSettingsTable();
    const client = getPersistenceClient();

    const key = url.searchParams.get("key");
    if (key) {
      const result = await client.execute({
        sql: "SELECT key, value FROM settings WHERE key = ?",
        args: [key] as InValue[],
      });
      const row = result.rows[0] as Record<string, unknown> | undefined;
      if (!row) {
        return new Response(JSON.stringify({ key, value: null }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ key: String(row.key), value: JSON.parse(String(row.value)) }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    // Return all settings
    const result = await client.execute("SELECT key, value FROM settings ORDER BY key");
    const settings: Record<string, unknown> = {};
    for (const row of result.rows) {
      const r = row as Record<string, unknown>;
      try {
        settings[String(r.key)] = JSON.parse(String(r.value));
      } catch {
        settings[String(r.key)] = String(r.value);
      }
    }
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    await ensureSettingsTable();
    const client = getPersistenceClient();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const key = typeof body.key === "string" ? body.key.trim() : "";
    if (!key) {
      return new Response(JSON.stringify({ error: "key is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const value = JSON.stringify(body.value ?? null);
    const now = Date.now();

    await client.execute({
      sql: `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [key, value, now] as InValue[],
    });

    return new Response(JSON.stringify({ key, value: body.value, updated_at: now }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to save setting" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
