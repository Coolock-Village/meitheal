/**
 * Task Templates API — Phase 31
 *
 * CRUD for reusable task blueprints.
 * POST with `template_id` creates a new task from the saved template.
 *
 * @domain domain-tasks
 * @kcs template_json schema: { title, description, priority, labels, task_type,
 *   recurrence_rule, checklists, custom_fields, board_id }
 */
import type { APIRoute } from "astro";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";

export const GET: APIRoute = async () => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const result = await client.execute(
      "SELECT * FROM task_templates ORDER BY position ASC, created_at ASC",
    );
    return new Response(JSON.stringify({ templates: result.rows }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch templates" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();
    const body = await request.json();

    // If template_id is provided, instantiate a task from template
    if (body.template_id) {
      const tmplResult = await client.execute({
        sql: "SELECT * FROM task_templates WHERE id = ?",
        args: [body.template_id],
      });

      const tmpl = tmplResult.rows[0] as Record<string, unknown> | undefined;
      if (!tmpl) {
        return new Response(
          JSON.stringify({ error: "Template not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      const template = JSON.parse(String(tmpl.template_json ?? "{}")) as Record<string, unknown>;
      const taskId = crypto.randomUUID();
      const now = Date.now();

      await client.execute({
        sql: `INSERT INTO tasks (id, title, description, status, priority, labels, task_type,
              recurrence_rule, checklists, custom_fields, board_id, framework_payload,
              calendar_sync_state, idempotency_key, request_id, created_at, updated_at)
              VALUES (?, ?, ?, 'todo', ?, ?, ?, ?, ?, ?, ?, '{}', 'pending', ?, ?, ?, ?)`,
        args: [
          taskId,
          String(template.title ?? "Untitled"),
          String(template.description ?? ""),
          Number(template.priority ?? 3),
          JSON.stringify(template.labels ?? []),
          String(template.task_type ?? "task"),
          template.recurrence_rule ? String(template.recurrence_rule) : null,
          JSON.stringify(template.checklists ?? []),
          JSON.stringify(template.custom_fields ?? {}),
          String(template.board_id ?? "default"),
          crypto.randomUUID(),
          crypto.randomUUID(),
          now,
          now,
        ],
      });

      return new Response(
        JSON.stringify({ id: taskId, created_from_template: body.template_id }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }

    // Otherwise, create a new template
    const { name, template_json, icon } = body as {
      name?: string;
      template_json?: Record<string, unknown>;
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

    const posResult = await client.execute(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM task_templates",
    );
    const position = Number(
      (posResult.rows[0] as Record<string, unknown>)?.next_pos ?? 0,
    );

    await client.execute({
      sql: `INSERT INTO task_templates (id, name, template_json, icon, position, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        name.trim(),
        JSON.stringify(template_json ?? {}),
        icon ?? "📝",
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
      JSON.stringify({ error: "Failed to process template request" }),
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
      sql: "DELETE FROM task_templates WHERE id = ?",
      args: [id],
    });

    return new Response(JSON.stringify({ deleted: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to delete template" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
