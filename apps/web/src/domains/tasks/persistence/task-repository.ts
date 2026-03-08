/**
 * TaskRepository — centralized domain service for all task-related database queries.
 * @domain Task Management
 *
 * Eliminates inline SQL across page files (index, kanban, calendar, gantt, today, upcoming)
 * by providing typed, parameterized query methods. All methods accept the persistence client
 * as their first argument, following the existing stateless pattern.
 *
 * @example
 *   import { TaskRepository } from '@domains/tasks/persistence/task-repository';
 *   const repo = new TaskRepository(getPersistenceClient());
 *   const tasks = await repo.getRecentTasks(10);
 */

import type { Client, InStatement } from "@libsql/client";
import { STATUS } from "../../../lib/status-config";

// ── Types ──────────────────────────────────────────────────────────────────

/** Generic task row — all fields returned raw from the database */
export type TaskRow = Record<string, unknown>;

/** Status count for dashboard statistics */
export interface StatusCount {
  status: string;
  count: number;
}

/** Dashboard statistics aggregate */
export interface DashboardStats {
  total: number;
  open: number;
  active: number;
  completed: number;
  overdue: number;
}

/** Board metadata */
export interface BoardInfo {
  id: string;
  name: string;
  color: string;
}

/** Calendar day task aggregate */
export interface CalendarDayInfo {
  dueDate: string;
  count: number;
  colors: string[];
  haEvents: number;
}

/** Kanban lane definition */
export interface KanbanLane {
  id: string;
  key: string;
  label: string;
  icon: string;
  includes: string[];
  builtIn: boolean;
  wipLimit: number;
}

/** Comment count per task */
export type CommentCounts = Record<string, number>;

/** Setting key-value pair */
export interface SettingRow {
  key: string;
  value: string;
}

// ── Repository ─────────────────────────────────────────────────────────────

/**
 * Centralized repository for task-related database queries.
 * Replaces inline SQL in Astro page files to enforce DDD boundaries.
 *
 * Design decisions:
 * - Returns raw `TaskRow[]` to avoid coupling to specific page needs.
 * - Uses parameterized queries to prevent SQL injection.
 * - Each method maps 1:1 to a query previously inline in a page file.
 * - Stateless: client injected via constructor (follows existing store pattern).
 */
export class TaskRepository {
  constructor(private readonly client: Client) {}

  // ── Dashboard (index.astro) ─────────────────────────────────────────

  /** Recent tasks for dashboard hero section */
  async getRecentTasks(limit = 10): Promise<TaskRow[]> {
    const result = await this.client.execute(
      `SELECT id, title, description, status, priority, due_date, labels, calendar_sync_state, is_favorite, board_id, color, ticket_number, task_type, created_at, updated_at
       FROM tasks ORDER BY created_at DESC LIMIT ${limit}`,
    );
    return result.rows as TaskRow[];
  }

  /** Favorited, non-complete tasks */
  async getFavoriteTasks(limit = 5): Promise<TaskRow[]> {
    const result = await this.client.execute({
      sql: `SELECT id, title, status, priority, due_date, is_favorite
            FROM tasks WHERE is_favorite = 1 AND status != ?
            ORDER BY updated_at DESC LIMIT ${limit}`,
      args: [STATUS.COMPLETE],
    });
    return result.rows as TaskRow[];
  }

  /** Open (non-complete) tasks ordered by priority then due date */
  async getOpenTasks(limit = 15): Promise<TaskRow[]> {
    const result = await this.client.execute({
      sql: `SELECT id, title, status, priority, due_date, assigned_to, board_id, ticket_number, task_type
            FROM tasks WHERE status NOT IN (?)
            ORDER BY priority ASC, due_date ASC NULLS LAST, updated_at DESC
            LIMIT ${limit}`,
      args: [STATUS.COMPLETE],
    });
    return result.rows as TaskRow[];
  }

  /** Count tasks grouped by status for dashboard stats */
  async getStatusCounts(): Promise<DashboardStats> {
    const result = await this.client.execute(
      "SELECT status, COUNT(*) as cnt FROM tasks GROUP BY status",
    );
    const stats: DashboardStats = { total: 0, open: 0, active: 0, completed: 0, overdue: 0 };
    for (const row of result.rows) {
      const r = row as Record<string, unknown>;
      const s = String(r.status);
      const c = Number(r.cnt);
      stats.total += c;
      if (s === STATUS.ACTIVE) stats.active += c;
      if (s === STATUS.COMPLETE) stats.completed += c;
      else stats.open += c;
    }
    return stats;
  }

  /** Count overdue tasks (past due, not complete) */
  async getOverdueCount(): Promise<number> {
    const result = await this.client.execute({
      sql: `SELECT COUNT(*) as cnt FROM tasks
            WHERE due_date IS NOT NULL AND due_date < ? AND status != ?`,
      args: [new Date().toISOString(), STATUS.COMPLETE],
    });
    return Number((result.rows[0] as Record<string, unknown>)?.cnt ?? 0);
  }

  /** All boards (for card badges on dashboard) */
  async getBoards(): Promise<Record<string, BoardInfo>> {
    const result = await this.client.execute("SELECT id, title, color FROM boards");
    const boardMap: Record<string, BoardInfo> = {
      default: { id: "default", name: "Default", color: "#6366F1" },
    };
    for (const b of result.rows) {
      const br = b as Record<string, unknown>;
      boardMap[String(br.id)] = {
        id: String(br.id),
        name: String(br.title ?? "Default"),
        color: String(br.color ?? "#6366F1"),
      };
    }
    return boardMap;
  }

  // ── Kanban (kanban.astro) ───────────────────────────────────────────

  /** All tasks for kanban board, ordered by position then priority */
  async getKanbanTasks(): Promise<TaskRow[]> {
    const result = await this.client.execute(
      `SELECT id, title, description, status, priority, due_date, labels, framework_payload, calendar_sync_state, board_id, custom_fields, start_date, end_date, progress, color, is_favorite, task_type, parent_id, ticket_number, assigned_to, kanban_position, created_at, updated_at
       FROM tasks ORDER BY kanban_position ASC NULLS LAST, priority ASC, created_at DESC`,
    );
    return result.rows as TaskRow[];
  }

  /** Comment counts per task (for kanban card badges) */
  async getCommentCounts(): Promise<CommentCounts> {
    const result = await this.client.execute(
      "SELECT task_id, COUNT(*) as cnt FROM comments GROUP BY task_id",
    );
    const counts: CommentCounts = {};
    for (const row of result.rows) {
      const r = row as Record<string, unknown>;
      counts[String(r.task_id)] = Number(r.cnt);
    }
    return counts;
  }

  /** Kanban lane definitions ordered by position */
  async getKanbanLanes(): Promise<KanbanLane[]> {
    const result = await this.client.execute(
      "SELECT id, key, label, icon, position, wip_limit, includes, built_in FROM kanban_lanes ORDER BY position ASC",
    );
    return result.rows.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      key: String(r.key),
      label: String(r.label),
      icon: String(r.icon),
      includes: JSON.parse(String(r.includes ?? "[]")),
      builtIn: Number(r.built_in ?? 0) === 1,
      wipLimit: Number(r.wip_limit ?? 0),
    }));
  }

  /** Get settings by keys (e.g. completed_auto_hide_days, backlog_mode) */
  async getSettings(keys: string[]): Promise<Record<string, string>> {
    const placeholders = keys.map(() => "?").join(", ");
    const result = await this.client.execute({
      sql: `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
      args: keys,
    });
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      const r = row as Record<string, unknown>;
      settings[String(r.key)] = String(r.value);
    }
    return settings;
  }

  // ── Calendar (calendar.astro) ───────────────────────────────────────

  /** Task counts per day for a given month (non-complete) */
  async getCalendarTaskCounts(
    monthStart: string,
    monthEnd: string,
  ): Promise<Record<string, CalendarDayInfo>> {
    const result = await this.client.execute({
      sql: `SELECT due_date, COUNT(*) as cnt, GROUP_CONCAT(COALESCE(color, ''), ',') as colors
            FROM tasks
            WHERE due_date >= ? AND due_date <= ? AND status NOT IN (?)
            GROUP BY due_date`,
      args: [monthStart, monthEnd, STATUS.COMPLETE],
    });

    const tasksByDay: Record<string, CalendarDayInfo> = {};
    for (const row of result.rows) {
      const r = row as Record<string, unknown>;
      const dateStr = String(r.due_date);
      tasksByDay[dateStr] = {
        dueDate: dateStr,
        count: Number(r.cnt),
        colors: String(r.colors ?? "")
          .split(",")
          .filter((c) => c.length > 0)
          .slice(0, 3),
        haEvents: 0,
      };
    }
    return tasksByDay;
  }

  /** HA-synced event counts per day for calendar view */
  async getCalendarHAEventCounts(
    monthStart: string,
    monthEnd: string,
  ): Promise<Record<string, number>> {
    const result = await this.client.execute({
      sql: `SELECT due_date, COUNT(*) as cnt
            FROM tasks
            WHERE due_date >= ? AND due_date <= ? AND calendar_sync_state = 'synced'
            GROUP BY due_date`,
      args: [monthStart, monthEnd],
    });
    const counts: Record<string, number> = {};
    for (const row of result.rows) {
      const r = row as Record<string, unknown>;
      counts[String(r.due_date)] = Number(r.cnt);
    }
    return counts;
  }

  // ── Gantt (gantt.astro) ─────────────────────────────────────────────

  /** All tasks with date fields for Gantt chart rendering */
  async getGanttTasks(): Promise<TaskRow[]> {
    const result = await this.client.execute(
      `SELECT id, title, status, priority, due_date, start_date, color, task_type, progress, ticket_number, parent_id
       FROM tasks ORDER BY start_date ASC NULLS LAST, created_at DESC`,
    );
    return result.rows as TaskRow[];
  }

  // ── Today (today.astro) ─────────────────────────────────────────────

  /** Overdue tasks (past due date, non-complete) */
  async getOverdueTasks(todayStr: string): Promise<TaskRow[]> {
    const result = await this.client.execute({
      sql: `SELECT * FROM tasks
            WHERE due_date IS NOT NULL AND due_date < ?
              AND status NOT IN (?)
            ORDER BY due_date ASC`,
      args: [todayStr, STATUS.COMPLETE],
    });
    return result.rows as TaskRow[];
  }

  /** Tasks due on a specific date (non-complete) */
  async getTasksDueOn(dateStr: string): Promise<TaskRow[]> {
    const result = await this.client.execute({
      sql: `SELECT * FROM tasks
            WHERE due_date = ? AND status NOT IN (?)
            ORDER BY priority DESC, created_at ASC`,
      args: [dateStr, STATUS.COMPLETE],
    });
    return result.rows as TaskRow[];
  }

  /** Unscheduled tasks (no due date, non-complete) */
  async getUnscheduledTasks(limit = 10): Promise<TaskRow[]> {
    const result = await this.client.execute({
      sql: `SELECT * FROM tasks
            WHERE due_date IS NULL AND status NOT IN (?)
            ORDER BY priority DESC, created_at DESC
            LIMIT ${limit}`,
      args: [STATUS.COMPLETE],
    });
    return result.rows as TaskRow[];
  }

  // ── Upcoming (upcoming.astro) ───────────────────────────────────────

  /** Tasks within a date range (non-complete) for upcoming view */
  async getTasksInRange(startDate: string, endDate: string): Promise<TaskRow[]> {
    const result = await this.client.execute({
      sql: `SELECT * FROM tasks
            WHERE due_date >= ? AND due_date <= ?
              AND status NOT IN (?)
            ORDER BY due_date ASC, priority DESC, created_at ASC`,
      args: [startDate, endDate, STATUS.COMPLETE],
    });
    return result.rows as TaskRow[];
  }
}
