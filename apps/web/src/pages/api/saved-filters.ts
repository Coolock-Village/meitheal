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

export const GET: APIRoute = async () => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const result = await client.execute(
      "SELECT * FROM saved_filters ORDER BY position ASC, created_at ASC",
    );
    return new Response(JSON.stringify({ filters: result.rows }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch saved filters" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const body = await request.json();

    const { name, query_json, icon } = body as {
      name?: string;
      query_json?: Record<string, unknown>;
      icon?: string;
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
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

    return new Response(
      JSON.stringify({ id, name: name.trim(), position }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create saved filter" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "id query parameter is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    await client.execute({
      sql: "DELETE FROM saved_filters WHERE id = ?",
      args: [id],
    });

    return new Response(JSON.stringify({ deleted: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to delete saved filter" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
