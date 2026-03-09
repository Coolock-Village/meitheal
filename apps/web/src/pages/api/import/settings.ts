import type { APIRoute } from "astro"
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store"
import { SettingsRepository } from "@domains/tasks/persistence/settings-repository"
import { logApiError, logApiWarn } from "../../../lib/api-logger"

/** Known safe setting keys — only these will be imported.
 * IMPORTANT: Update this set when adding new saveSetting() calls.
 * Last audited: 2026-03-09 (SQL-02 Migration) */
const ALLOWED_KEYS = new Set([
    // ── Home Assistant / Connectivity ──
    "ha-url", "ha-token", "ha_url", "ha_token",
    "vikunja-url", "vikunja-token",
    "calendar-entity", "calendar_entity", "cal_entity", "calendar_entities", "caldav_url", "calendar_sync_enabled", "calendar_write_back", "calendar_sync_interval_ms",
    // ── UI Preferences ──
    "default-board", "theme", "default-view", "wip-limit",
    "show-description", "column-order", "locale",
    "sidebar-collapsed", "sidebar_config",
    "timezone", "week_start", "date_format",
    "kanban-group-by", "task-detail-width",
    // ── Notifications ──
    "enable-notifications", "notification-sound", "notification-vibrate",
    // ── Scoring Frameworks ──
    "rice-scoring-enabled", "heart-scoring-enabled", "kcs-scoring-enabled",
    "framework_mapping",
    // ── AI & Agent Protocols ──
    "ai-provider", "ai-custom-url",
    "agent-protocols-a2a-enabled", "agent-protocols-webmcp-enabled", "agent-protocols-mcp-enabled",
    // ── Webhooks & Integrations ──
    "webhook_endpoint", "webhook_secret", "webhook_format",
    "n8n_webhook_url", "n8n_events", "n8n_mode", "n8n_api_key", "n8n_signing_secret",
    "grocy_url", "grocy_api_key", "grocy_sync_mode",
    // ── Todo Sync ──
    "todo_sync_enabled", "todo_entity", "todo_sync_direction",
    // ── Custom Fields ──
    "custom_fields",
    // ── Custom Theme ──
    "custom_theme_css", "custom_theme_name", "accent-color",
])

export const POST: APIRoute = async ({ request }) => {
    try {
        // Guard against oversized payloads (100KB max)
        const contentLength = Number(request.headers.get("content-length") ?? 0)
        if (contentLength > 102400) {
            return new Response(JSON.stringify({ error: "Import payload too large (max 100KB)" }), { status: 413, headers: { "Content-Type": "application/json" } })
        }

        const data = await request.json()

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return new Response(JSON.stringify({ error: "Invalid settings payload format. Expected a key-value object." }), { status: 400, headers: { "Content-Type": "application/json" } })
        }

        await ensureSchema()
        const repo = new SettingsRepository(getPersistenceClient())
        await repo.ensureSettingsTable()

        // Build validated entries for batch import
        const entries: Array<{ key: string; value: string }> = []
        for (const [key, value] of Object.entries(data)) {
            if (typeof key !== "string" || value === null || value === undefined) {
                continue
            }
            if (!ALLOWED_KEYS.has(key)) {
                logApiWarn("import-settings", `Rejected unknown key: ${key}`)
                continue
            }

            const stringValue = typeof value === "string" ? value : JSON.stringify(value)
            entries.push({ key, value: stringValue })
        }

        if (entries.length === 0) {
            return new Response(JSON.stringify({ success: false, message: "No valid settings found in payload." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            })
        }

        const count = await repo.importBatch(entries)

        return new Response(JSON.stringify({ success: true, message: `${count} settings imported successfully.` }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })
    } catch (error) {
        logApiError("import-settings", "Failed to import settings", error)
        return new Response(JSON.stringify({ error: "Import failed: payload could not be processed." }), { status: 500, headers: { "Content-Type": "application/json" } })
    }
}
