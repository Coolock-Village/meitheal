import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

/**
 * Default assignee setting.
 * GET  /api/users/default — Get current default assignee
 * PUT  /api/users/default — Set default assignee { user_id } (null to clear)
 */
export const GET: APIRoute = async () => {
  await ensureSchema();
  const client = getPersistenceClient();
  const result = await client.execute(
    "SELECT value FROM app_settings WHERE key = 'default_assignee' LIMIT 1"
  );
  const value = result.rows.length > 0
    ? String((result.rows[0] as Record<string, unknown>).value)
    : null;

  return new Response(JSON.stringify({ default_assignee: value }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  await ensureSchema();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const userId = body.user_id;
  const now = Date.now();
  const client = getPersistenceClient();

  if (userId === null || userId === undefined || userId === "") {
    // Clear default
    await client.execute("DELETE FROM app_settings WHERE key = 'default_assignee'");
    return new Response(JSON.stringify({ default_assignee: null }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  }

  if (typeof userId !== "string") {
    return new Response(JSON.stringify({ error: "user_id must be a string or null" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }

  if (userId.length > 255) {
    return new Response(JSON.stringify({ error: "user_id exceeds max length (255)" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }

  if (!/^(ha_|custom_)/.test(userId)) {
    return new Response(JSON.stringify({ error: "user_id must start with 'ha_' or 'custom_'" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }

  await client.execute({
    sql: `INSERT INTO app_settings (key, value, updated_at) VALUES ('default_assignee', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [userId, now],
  });

  return new Response(JSON.stringify({ default_assignee: userId }), {
    status: 200, headers: { "content-type": "application/json" },
  });
};
