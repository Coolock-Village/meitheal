import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { sanitize } from "../../../lib/sanitize";

/**
 * Custom (non-HA) users CRUD.
 * GET  /api/users/custom — List custom users
 * POST /api/users/custom — Create custom user { name, color? }
 */
export const GET: APIRoute = async () => {
  await ensureSchema();
  const client = getPersistenceClient();
  const result = await client.execute(
    "SELECT id, name, color, created_at, updated_at FROM custom_users ORDER BY name ASC"
  );
  const users = result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      name: String(r.name),
      color: String(r.color ?? "#6366f1"),
      created_at: Number(r.created_at),
      updated_at: Number(r.updated_at),
    };
  });
  return new Response(JSON.stringify({ users }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  await ensureSchema();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  const name = sanitize(rawName);
  if (!name || name.length > 100) {
    return new Response(JSON.stringify({ error: "name is required (max 100 chars)" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }

  const color = typeof body.color === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(body.color)
    ? body.color : "#6366f1";

  const id = `custom_${crypto.randomUUID().slice(0, 8)}`;
  const now = Date.now();
  const client = getPersistenceClient();

  await client.execute({
    sql: "INSERT INTO custom_users (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    args: [id, name, color, now, now],
  });

  return new Response(JSON.stringify({ id, name, color, created_at: now, updated_at: now }), {
    status: 201, headers: { "content-type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  await ensureSchema();
  // Read id from URL search params (client sends ?id=xxx)
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim() ?? "";

  if (!id) {
    return new Response(JSON.stringify({ error: "id is required" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }

  const client = getPersistenceClient();
  const existing = await client.execute({
    sql: "SELECT id FROM custom_users WHERE id = ? LIMIT 1",
    args: [id],
  });
  if (existing.rows.length === 0) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404, headers: { "content-type": "application/json" },
    });
  }

  await client.execute({ sql: "DELETE FROM custom_users WHERE id = ?", args: [id] });

  // Clear assigned_to for tasks assigned to this user
  await client.execute({
    sql: "UPDATE tasks SET assigned_to = NULL, updated_at = ? WHERE assigned_to = ?",
    args: [Date.now(), id],
  });

  return new Response(JSON.stringify({ deleted: true }), {
    status: 200, headers: { "content-type": "application/json" },
  });
};
