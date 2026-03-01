/**
 * Reminders API — Phase 31
 *
 * Returns tasks with pending reminders (reminder_at <= now and not completed).
 * Used by service worker polling and dashboard to trigger push notifications.
 *
 * @domain domain-tasks
 */
import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

export const GET: APIRoute = async () => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const now = new Date().toISOString();

    const result = await client.execute({
      sql: `SELECT id, title, due_date, reminder_at, priority, status
            FROM tasks
            WHERE reminder_at IS NOT NULL
              AND reminder_at <= ?
              AND status NOT IN ('complete', 'done')
            ORDER BY reminder_at ASC
            LIMIT 50`,
      args: [now],
    });

    return new Response(
      JSON.stringify({ reminders: result.rows, checked_at: now }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch reminders" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

/**
 * POST: Dismiss a reminder by clearing its reminder_at field.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const body = await request.json();

    const { task_id, action } = body as {
      task_id?: string;
      action?: "dismiss" | "snooze";
    };

    if (!task_id) {
      return new Response(
        JSON.stringify({ error: "task_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (action === "snooze") {
      // Snooze by 1 hour
      const snoozeTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await client.execute({
        sql: "UPDATE tasks SET reminder_at = ?, updated_at = ? WHERE id = ?",
        args: [snoozeTime, Date.now(), task_id],
      });
      return new Response(
        JSON.stringify({ snoozed_until: snoozeTime }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Default: dismiss
    await client.execute({
      sql: "UPDATE tasks SET reminder_at = NULL, updated_at = ? WHERE id = ?",
      args: [Date.now(), task_id],
    });

    return new Response(JSON.stringify({ dismissed: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to process reminder action" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
