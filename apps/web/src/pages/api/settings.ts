import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { apiError, apiJson } from "../../lib/api-response";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["tasks", "audit", "observability"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: true,
});

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
        return apiJson({ key, value: null });
      }
      return apiJson({ key: String(row.key), value: JSON.parse(String(row.value)) });
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
    return apiJson(settings);
  } catch (err) {
    logger.log("error", {
      event: "api.settings.get.failed",
      domain: "tasks",
      component: "settings-api",
      request_id: crypto.randomUUID(),
      message: err instanceof Error ? err.message : "Unknown error",
    });
    return apiError("Failed to load settings");
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    await ensureSettingsTable();
    const client = getPersistenceClient();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const key = typeof body.key === "string" ? body.key.trim() : "";
    if (!key || key.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(key)) {
      return apiError("key must be 1-100 alphanumeric/hyphen/underscore characters", 400);
    }

    const value = JSON.stringify(body.value ?? null);
    // Cap value size: 64KB for custom theme CSS, 10KB for everything else
    const maxSize = key === "custom_theme_css" ? 65536 : 10240;
    if (value.length > maxSize) {
      return apiError(`value exceeds ${maxSize > 10240 ? "64KB" : "10KB"} limit`, 400);
    }
    const now = Date.now();

    await client.execute({
      sql: `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [key, value, now] as InValue[],
    });

    return apiJson({ key, value: body.value, updated_at: now });
  } catch (err) {
    logger.log("error", {
      event: "api.settings.put.failed",
      domain: "tasks",
      component: "settings-api",
      request_id: crypto.randomUUID(),
      message: err instanceof Error ? err.message : "Unknown error",
    });
    return apiError("Failed to save setting");
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const reset = url.searchParams.get("reset");
    if (reset !== "all") {
      return apiError("Use ?reset=all to confirm reset", 400);
    }
    await ensureSettingsTable();
    const client = getPersistenceClient();
    await client.execute("DELETE FROM settings");

    logger.audit({
      event: "audit.settings.reset",
      domain: "audit",
      component: "settings-api",
      request_id: crypto.randomUUID(),
      message: "All settings reset to defaults",
    });

    return apiJson({ reset: true });
  } catch (err) {
    logger.log("error", {
      event: "api.settings.delete.failed",
      domain: "tasks",
      component: "settings-api",
      request_id: crypto.randomUUID(),
      message: err instanceof Error ? err.message : "Unknown error",
    });
    return apiError("Failed to reset settings");
  }
};
