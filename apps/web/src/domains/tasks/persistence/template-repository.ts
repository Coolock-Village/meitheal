/**
 * TemplateRepository — domain service for task template database queries.
 * @domain Task Management (Templates context)
 *
 * Provides typed, parameterized query methods for task template CRUD
 * and task instantiation from templates.
 */
import type { Client } from "@libsql/client"
import { STATUS } from "../../../lib/status-config"

export class TemplateRepository {
  constructor(private client: Client) {}

  /** List all templates ordered by position */
  async findAll() {
    const result = await this.client.execute(
      "SELECT * FROM task_templates ORDER BY position ASC, created_at ASC"
    )
    return result.rows
  }

  /** Find a template by ID */
  async findById(id: string) {
    const result = await this.client.execute({
      sql: "SELECT * FROM task_templates WHERE id = ?",
      args: [id],
    })
    return (result.rows[0] as Record<string, unknown>) ?? null
  }

  /** Get next available template position */
  async getNextPosition(): Promise<number> {
    const result = await this.client.execute(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM task_templates"
    )
    return Number((result.rows[0] as Record<string, unknown>)?.next_pos ?? 0)
  }

  /** Create a task from a template */
  async instantiateFromTemplate(taskId: string, template: Record<string, unknown>): Promise<void> {
    const now = Date.now()
    await this.client.execute({
      sql: `INSERT INTO tasks (id, title, description, status, priority, labels, task_type,
            recurrence_rule, checklists, custom_fields, board_id, framework_payload,
            calendar_sync_state, idempotency_key, request_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', ?, ?, ?, ?, ?)`,
      args: [
        taskId,
        String(template.title ?? "Untitled"),
        String(template.description ?? ""),
        STATUS.PENDING,
        Number(template.priority ?? 3),
        JSON.stringify(template.labels ?? []),
        String(template.task_type ?? "task"),
        template.recurrence_rule ? String(template.recurrence_rule) : null,
        JSON.stringify(template.checklists ?? []),
        JSON.stringify(template.custom_fields ?? {}),
        String(template.board_id ?? "default"),
        STATUS.PENDING,
        crypto.randomUUID(),
        crypto.randomUUID(),
        now,
        now,
      ],
    })
  }

  /** Create a new template */
  async create(data: {
    id: string; name: string; templateJson: string; icon: string; position: number
  }): Promise<void> {
    const now = Date.now()
    await this.client.execute({
      sql: `INSERT INTO task_templates (id, name, template_json, icon, position, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [data.id, data.name, data.templateJson, data.icon, data.position, now, now],
    })
  }

  /** Delete a template by ID */
  async delete(id: string): Promise<void> {
    await this.client.execute({
      sql: "DELETE FROM task_templates WHERE id = ?",
      args: [id],
    })
  }
}
