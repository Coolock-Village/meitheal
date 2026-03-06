/**
 * Saved Filters API — Phase 31
 *
 * CRUD for user-defined saved filter combinations (smart views).
 *
 * @domain domain-tasks
 * @kcs saved filter query format: JSON object with optional keys:
 *   status, priority, board_id, search, rice, task_type, sort
 */
import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { apiError, apiJson } from "../../lib/api-response";
import { logApiError } from "../../lib/api-logger";

export const GET: APIRoute = async () => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const result = await client.execute(
      "SELECT * FROM saved_filters ORDER BY position ASC, created_at ASC",
    );
    return apiJson({ filters: result.rows });
  } catch (error) {
    logApiError("saved-filters", "GET error", error);
    return apiError("Failed to fetch saved filters", 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();

    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    const { name, query_json, icon } = body as {
      name?: string;
      query_json?: Record<string, unknown>;
      icon?: string;
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return apiError("name is required", 400);
    }

    if (name.trim().length > 100) {
      return apiError("name must be 100 characters or fewer", 400);
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    // Get next position
    const posResult = await client.execute(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM saved_filters",
    );
    const position = Number(
      (posResult.rows[0] as Record<string, unknown>)?.next_pos ?? 0,
    );

    await client.execute({
      sql: `INSERT INTO saved_filters (id, name, query_json, icon, position, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        name.trim(),
        JSON.stringify(query_json ?? {}),
        icon ?? "🔍",
        position,
        now,
        now,
      ],
    });

    return apiJson({ id, name: name.trim(), position }, 201);
  } catch (error) {
    logApiError("saved-filters", "POST error", error);
    return apiError("Failed to create saved filter", 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return apiError("id query parameter is required", 400);
    }

    await client.execute({
      sql: "DELETE FROM saved_filters WHERE id = ?",
      args: [id],
    });

    return apiJson({ deleted: true });
  } catch (error) {
    logApiError("saved-filters", "DELETE error", error);
    return apiError("Failed to delete saved filter", 500);
  }
};
