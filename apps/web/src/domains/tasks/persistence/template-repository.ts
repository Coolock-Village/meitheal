/**
 * TemplateRepository — domain service for task template database queries.
 * @domain Task Management (Templates context)
 *
 * Provides typed, parameterized query methods for task template CRUD
 * and task instantiation from templates.
 *
 * Habit templates (is_habit=1) are a specialization that auto-create
 * recurring tasks. Streaks are derived from completed task dates.
 *
 * @kcs Habits are NOT isolated — they create real tasks via templates.
 * Tasks created from habits carry source_template_id for tracking.
 */
import type { Client } from "@libsql/client"
import { STATUS } from "../../../lib/status-config"

export interface HabitTemplateRow {
  id: string
  name: string
  template_json: string
  icon: string
  frequency: string
  position: number
  created_at: number
  updated_at: number
}

export interface HabitWithStats extends HabitTemplateRow {
  todayCompleted: boolean
  todayTaskId: string | null
  lastCompletedDate: string | null
  currentStreak: number
  longestStreak: number
  totalCompletions: number
  checklists: Array<{ text: string; done: boolean }>
}

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
    id: string; name: string; templateJson: string; icon: string; position: number; isHabit?: boolean; frequency?: string
  }): Promise<void> {
    const now = Date.now()
    await this.client.execute({
      sql: `INSERT INTO task_templates (id, name, template_json, icon, is_habit, frequency, position, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [data.id, data.name, data.templateJson, data.icon, data.isHabit ? 1 : 0, data.frequency ?? "daily", data.position, now, now],
    })
  }

  /** Delete a template by ID */
  async delete(id: string): Promise<void> {
    await this.client.execute({
      sql: "DELETE FROM task_templates WHERE id = ?",
      args: [id],
    })
  }

  /** Update a template */
  async update(id: string, data: {
    name?: string; templateJson?: string; icon?: string; frequency?: string
  }): Promise<void> {
    const sets: string[] = []
    const args: (string | number)[] = []

    if (data.name !== undefined) { sets.push("name = ?"); args.push(data.name) }
    if (data.templateJson !== undefined) { sets.push("template_json = ?"); args.push(data.templateJson) }
    if (data.icon !== undefined) { sets.push("icon = ?"); args.push(data.icon) }
    if (data.frequency !== undefined) { sets.push("frequency = ?"); args.push(data.frequency) }

    if (sets.length === 0) return

    sets.push("updated_at = ?")
    args.push(Date.now())
    args.push(id)

    await this.client.execute({
      sql: `UPDATE task_templates SET ${sets.join(", ")} WHERE id = ?`,
      args,
    })
  }

  // ── Habit-Specific Methods ──────────────────────────────────────

  /** Find all habit templates */
  async findHabits(): Promise<HabitTemplateRow[]> {
    const result = await this.client.execute(
      "SELECT * FROM task_templates WHERE is_habit = 1 ORDER BY position ASC, created_at ASC"
    )
    return result.rows.map(r => {
      const row = r as Record<string, unknown>
      return {
        id: String(row.id),
        name: String(row.name),
        template_json: String(row.template_json ?? "{}"),
        icon: String(row.icon ?? "✅"),
        frequency: String(row.frequency ?? "daily"),
        position: Number(row.position ?? 0),
        created_at: Number(row.created_at),
        updated_at: Number(row.updated_at),
      }
    })
  }

  /**
   * Get habits with stats — enriches each habit template with:
   * - Today's completion status (from linked tasks)
   * - Last completed date
   * - Current and longest streaks
   * - Total completions
   * - Checklists from template
   */
  async getHabitsWithStats(): Promise<HabitWithStats[]> {
    const habits = await this.findHabits()
    const today = new Date().toISOString().split("T")[0]!
    const results: HabitWithStats[] = []

    for (const habit of habits) {
      // Today's task for this habit
      const todayTask = await this.client.execute({
        sql: `SELECT id, status FROM tasks
              WHERE source_template_id = ? AND due_date = ?
              ORDER BY created_at DESC LIMIT 1`,
        args: [habit.id, today],
      })
      const todayRow = todayTask.rows[0] as Record<string, unknown> | undefined
      const todayCompleted = todayRow ? String(todayRow.status) === "complete" : false
      const todayTaskId = todayRow ? String(todayRow.id) : null

      // Last completed date
      const lastCompleted = await this.client.execute({
        sql: `SELECT due_date FROM tasks
              WHERE source_template_id = ? AND status = 'complete'
              ORDER BY due_date DESC LIMIT 1`,
        args: [habit.id],
      })
      const lastRow = lastCompleted.rows[0] as Record<string, unknown> | undefined
      const lastCompletedDate = lastRow ? String(lastRow.due_date) : null

      // Total completions
      const totalResult = await this.client.execute({
        sql: "SELECT COUNT(*) as cnt FROM tasks WHERE source_template_id = ? AND status = 'complete'",
        args: [habit.id],
      })
      const totalCompletions = Number((totalResult.rows[0] as Record<string, unknown>).cnt)

      // Streak calculation from completed task dates
      const streakData = await this.calculateStreak(habit.id)

      // Parse checklists from template JSON
      let checklists: Array<{ text: string; done: boolean }> = []
      try {
        const tmpl = JSON.parse(habit.template_json) as Record<string, unknown>
        if (Array.isArray(tmpl.checklists)) {
          checklists = tmpl.checklists as Array<{ text: string; done: boolean }>
        }
      } catch { /* invalid JSON */ }

      results.push({
        ...habit,
        todayCompleted,
        todayTaskId,
        lastCompletedDate,
        currentStreak: streakData.current,
        longestStreak: streakData.longest,
        totalCompletions,
        checklists,
      })
    }

    return results
  }

  /**
   * Create today's task from a habit template.
   * If today's task already exists, returns its ID without creating a duplicate.
   *
   * @returns { taskId, alreadyExisted }
   */
  async instantiateHabitTask(templateId: string): Promise<{ taskId: string; alreadyExisted: boolean }> {
    const today = new Date().toISOString().split("T")[0]!

    // Check if today's task already exists
    const existing = await this.client.execute({
      sql: `SELECT id FROM tasks WHERE source_template_id = ? AND due_date = ? LIMIT 1`,
      args: [templateId, today],
    })
    if (existing.rows.length > 0) {
      return { taskId: String((existing.rows[0] as Record<string, unknown>).id), alreadyExisted: true }
    }

    // Get template
    const tmpl = await this.findById(templateId)
    if (!tmpl) throw new Error(`Template not found: ${templateId}`)

    const template = JSON.parse(String(tmpl.template_json ?? "{}")) as Record<string, unknown>
    const taskId = crypto.randomUUID()
    const now = Date.now()

    // Get next ticket number
    const nextNumResult = await this.client.execute(
      "SELECT COALESCE(MAX(ticket_number), 0) + 1 AS next_num FROM tasks"
    )
    const ticketNumber = Number((nextNumResult.rows[0] as Record<string, unknown>)?.next_num ?? 1)

    // Reset checklists (all unchecked for new day)
    let checklists = "[]"
    try {
      if (Array.isArray(template.checklists)) {
        checklists = JSON.stringify(
          (template.checklists as Array<{ text: string }>).map(item => ({
            text: item.text,
            done: false,
          }))
        )
      }
    } catch { /* keep default */ }

    // Build habit task label
    const labels = Array.isArray(template.labels) ? [...template.labels] : []
    if (!labels.includes("habit")) labels.push("habit")

    await this.client.execute({
      sql: `INSERT INTO tasks (id, title, description, status, priority, labels, task_type,
            due_date, checklists, custom_fields, board_id, source_template_id, ticket_number,
            framework_payload, calendar_sync_state, idempotency_key, request_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', 'pending', ?, ?, ?, ?)`,
      args: [
        taskId,
        String(template.title ?? tmpl.name ?? "Habit"),
        String(template.description ?? ""),
        STATUS.PENDING,
        Number(template.priority ?? 3),
        JSON.stringify(labels),
        String(template.task_type ?? "task"),
        today,
        checklists,
        JSON.stringify(template.custom_fields ?? {}),
        String(template.board_id ?? "default"),
        templateId,
        ticketNumber,
        crypto.randomUUID(),
        crypto.randomUUID(),
        now,
        now,
      ],
    })

    return { taskId, alreadyExisted: false }
  }

  /**
   * Calculate current and longest streak for a habit.
   * Streaks are derived from distinct completed task dates (due_date).
   */
  private async calculateStreak(templateId: string): Promise<{ current: number; longest: number }> {
    const result = await this.client.execute({
      sql: `SELECT DISTINCT due_date FROM tasks
            WHERE source_template_id = ? AND status = 'complete' AND due_date IS NOT NULL
            ORDER BY due_date DESC`,
      args: [templateId],
    })

    if (result.rows.length === 0) return { current: 0, longest: 0 }

    const dates = result.rows.map(r => String((r as Record<string, unknown>).due_date))
    const today = new Date().toISOString().split("T")[0]!

    let current = 0
    let longest = 0
    let streak = 0
    let expectedDate = today

    for (const date of dates) {
      if (date === expectedDate) {
        streak++
        const d = new Date(expectedDate)
        d.setDate(d.getDate() - 1)
        expectedDate = d.toISOString().split("T")[0]!
      } else if (streak === 0) {
        // First date might be yesterday if not yet completed today
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        if (date === yesterday.toISOString().split("T")[0]) {
          streak = 1
          const d = new Date(date)
          d.setDate(d.getDate() - 1)
          expectedDate = d.toISOString().split("T")[0]!
        } else {
          break
        }
      } else {
        // Streak broken
        if (current === 0) current = streak
        longest = Math.max(longest, streak)
        break
      }
    }

    if (current === 0) current = streak
    longest = Math.max(longest, streak)

    return { current, longest }
  }
}
