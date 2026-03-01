import type { APIRoute } from "astro";
import { apiJson } from "../../../lib/api-response";
import { buildAgentCard } from "@meitheal/integration-core";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

/**
 * GET /api/a2a/agent-card — Dynamic A2A Agent Card
 *
 * Returns the Meitheal Agent Card per A2A spec §8.
 * Skills are dynamically populated based on configured integrations.
 * Also served at /.well-known/agent-card.json (see static redirect).
 *
 * KCS: Agent Card adapts to configuration — HA skills appear only when HA is connected.
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();

    // Check if A2A is enabled in settings
    const a2aResult = await client.execute({
      sql: "SELECT value FROM settings WHERE key = ?",
      args: ["agent-protocols-a2a-enabled"],
    });

    const a2aEnabled =
      a2aResult.rows.length > 0
        ? JSON.parse(String((a2aResult.rows[0] as Record<string, unknown>).value)) === true
        : true; // Default: enabled

    if (!a2aEnabled) {
      return new Response(
        JSON.stringify({ error: "A2A protocol is disabled" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    // Check if HA is configured
    const haResult = await client.execute({
      sql: "SELECT value FROM settings WHERE key = ?",
      args: ["ha-url"],
    });
    const haConfigured = haResult.rows.length > 0 && Boolean((haResult.rows[0] as Record<string, unknown>).value);

    // Build Agent Card
    const baseUrl = `${url.protocol}//${url.host}`;
    const card = buildAgentCard({
      baseUrl,
      haConfigured,
      a2aEnabled: true,
    });

    return apiJson(card);
  } catch (error) {
    return apiJson(
      {
        error: "Failed to generate Agent Card",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};
