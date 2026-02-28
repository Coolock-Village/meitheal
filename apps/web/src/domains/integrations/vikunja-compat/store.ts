import { getCollection } from "astro:content";
import { createTaskAndSyncCalendar } from "@domains/tasks/task-sync-service";
import {
  HomeAssistantCalendarAdapter,
  resolveHomeAssistantAuthFromEnv,
  type CalendarIntegrationAdapter
} from "@meitheal/integration-core";
import {
  ensureSchema,
  findTaskById,
  getPersistenceClient
} from "@domains/tasks/persistence/store";

export interface VikunjaCompatTaskInput {
  projectId: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: number;
  repeatAfter?: number;
  requestId: string;
  idempotencyKey: string;
}

export interface VikunjaCompatTask {
  id: string;
  title: string;
  description?: string;
  project_id: number;
  due_date?: string;
  priority?: number;
  repeat_after?: number;
  created: string;
  updated: string;
}

export interface VikunjaProject {
  id: number;
  title: string;
}

export interface VikunjaLabel {
  id: number;
  title: string;
  hex_color: string;
}

export interface VikunjaUser {
  id: number;
  username: string;
  name: string;
}

let compatEnsured = false;

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function isoFromEpoch(value: unknown): string {
  const asMs = typeof value === "number" ? value : Number(value ?? Date.now());
  return new Date(asMs).toISOString();
}

function toTaskResponse(row: Record<string, unknown>): VikunjaCompatTask {
  return {
    id: String(row.task_id),
    title: String(row.title),
    ...(typeof row.description === "string" && row.description.length > 0 ? { description: row.description } : {}),
    project_id: Number(row.project_id),
    ...(typeof row.due_date === "string" && row.due_date.length > 0 ? { due_date: row.due_date } : {}),
    ...(typeof row.priority === "number" ? { priority: row.priority } : {}),
    ...(typeof row.repeat_after === "number" ? { repeat_after: row.repeat_after } : {}),
    created: isoFromEpoch(row.created_at),
    updated: isoFromEpoch(row.updated_at)
  };
}

async function loadCompatCalendarDefaults() {
  try {
    const configs = await getCollection("config");
    const integrationsEntry = configs.find((entry: (typeof configs)[number]) => entry.id === "integrations");
    const compatibilityEntry = configs.find(
      (entry: (typeof configs)[number]) =>
        entry.id === "compatibility" || Boolean(entry.data.compatibility?.vikunja_api)
    );
    const calendar = integrationsEntry?.data.integrations?.calendar;
    const calendarSyncMode = compatibilityEntry?.data.compatibility?.vikunja_api?.calendar_sync_mode ?? "disabled";
    const enabled = calendarSyncMode === "enabled";

    if (!calendar) {
      return {
        enabled,
        entityId: "calendar.home",
        defaultDurationMinutes: 30,
        timezone: "UTC"
      };
    }

    return {
      enabled,
      entityId: calendar.entity_id,
      defaultDurationMinutes: calendar.default_duration_minutes,
      timezone: calendar.timezone
    };
  } catch {
    return {
      enabled: false,
      entityId: "calendar.home",
      defaultDurationMinutes: 30,
      timezone: "UTC"
    };
  }
}

export async function ensureVikunjaCompatSchema(): Promise<void> {
  if (compatEnsured) {
    return;
  }

  await ensureSchema();
  const client = getPersistenceClient();

  await client.execute(`
    CREATE TABLE IF NOT EXISTS vikunja_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS vikunja_labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE,
      hex_color TEXT NOT NULL DEFAULT '3f51b5'
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS vikunja_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS vikunja_project_users (
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      PRIMARY KEY(project_id, user_id)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS vikunja_task_meta (
      task_id TEXT PRIMARY KEY,
      project_id INTEGER NOT NULL,
      description TEXT,
      due_date TEXT,
      priority INTEGER,
      repeat_after INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS vikunja_task_labels (
      task_id TEXT NOT NULL,
      label_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY(task_id, label_id)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS vikunja_task_assignees (
      task_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY(task_id, user_id)
    )
  `);

  await client.execute("CREATE INDEX IF NOT EXISTS vikunja_task_meta_project_idx ON vikunja_task_meta(project_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS vikunja_labels_title_idx ON vikunja_labels(title)");
  await client.execute("CREATE INDEX IF NOT EXISTS vikunja_users_lookup_idx ON vikunja_users(username, name)");

  await client.execute("INSERT OR IGNORE INTO vikunja_projects(id, title) VALUES(1, 'Inbox')");
  await client.execute("INSERT OR IGNORE INTO vikunja_users(id, username, name) VALUES(1, 'villager', 'Villager')");
  await client.execute("INSERT OR IGNORE INTO vikunja_project_users(project_id, user_id) VALUES(1, 1)");

  compatEnsured = true;
}

export async function listVikunjaProjects(): Promise<VikunjaProject[]> {
  await ensureVikunjaCompatSchema();
  const client = getPersistenceClient();
  const result = await client.execute("SELECT id, title FROM vikunja_projects ORDER BY id ASC");
  return result.rows.map((row) => ({
    id: Number((row as Record<string, unknown>).id),
    title: String((row as Record<string, unknown>).title)
  }));
}

export async function projectExists(projectId: number): Promise<boolean> {
  await ensureVikunjaCompatSchema();
  const client = getPersistenceClient();
  const result = await client.execute({
    sql: "SELECT id FROM vikunja_projects WHERE id = ? LIMIT 1",
    args: [projectId]
  });
  return result.rows.length > 0;
}

export async function listVikunjaProjectUsers(projectId: number): Promise<VikunjaUser[]> {
  await ensureVikunjaCompatSchema();
  const client = getPersistenceClient();
  const result = await client.execute({
    sql: `
      SELECT u.id, u.username, u.name
      FROM vikunja_project_users pu
      JOIN vikunja_users u ON u.id = pu.user_id
      WHERE pu.project_id = ?
      ORDER BY u.id ASC
    `,
    args: [projectId]
  });

  return result.rows.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: Number(record.id),
      username: String(record.username),
      name: String(record.name)
    };
  });
}

export async function listVikunjaLabels(): Promise<VikunjaLabel[]> {
  await ensureVikunjaCompatSchema();
  const client = getPersistenceClient();
  const result = await client.execute("SELECT id, title, hex_color FROM vikunja_labels ORDER BY id ASC");
  return result.rows.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: Number(record.id),
      title: String(record.title),
      hex_color: String(record.hex_color)
    };
  });
}

export async function createVikunjaLabel(title: string, hexColor?: string): Promise<VikunjaLabel> {
  await ensureVikunjaCompatSchema();
  const client = getPersistenceClient();

  const existing = await client.execute({
    sql: "SELECT id, title, hex_color FROM vikunja_labels WHERE lower(title) = lower(?) LIMIT 1",
    args: [title]
  });
  const existingRow = existing.rows[0] as Record<string, unknown> | undefined;
  if (existingRow) {
    return {
      id: Number(existingRow.id),
      title: String(existingRow.title),
      hex_color: String(existingRow.hex_color)
    };
  }

  await client.execute({
    sql: "INSERT INTO vikunja_labels(title, hex_color) VALUES(?, ?)",
    args: [title, (hexColor && hexColor.length > 0 ? hexColor : "3f51b5").replace(/^#/, "")]
  });

  const inserted = await client.execute({
    sql: "SELECT id, title, hex_color FROM vikunja_labels WHERE lower(title) = lower(?) LIMIT 1",
    args: [title]
  });

  const row = inserted.rows[0] as Record<string, unknown>;
  return {
    id: Number(row.id),
    title: String(row.title),
    hex_color: String(row.hex_color)
  };
}

export async function listVikunjaUsers(search?: string, page = 1, perPage = 50): Promise<VikunjaUser[]> {
  await ensureVikunjaCompatSchema();
  const client = getPersistenceClient();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const offset = (safePage - 1) * perPage;

  if (!search || search.trim().length === 0) {
    const result = await client.execute({
      sql: "SELECT id, username, name FROM vikunja_users ORDER BY id ASC LIMIT ? OFFSET ?",
      args: [perPage, offset]
    });
    return result.rows.map((row) => {
      const record = row as Record<string, unknown>;
      return {
        id: Number(record.id),
        username: String(record.username),
        name: String(record.name)
      };
    });
  }

  const like = `%${search.trim()}%`;
  const result = await client.execute({
    sql: `
      SELECT id, username, name
      FROM vikunja_users
      WHERE username LIKE ? OR name LIKE ?
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `,
    args: [like, like, perPage, offset]
  });

  return result.rows.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: Number(record.id),
      username: String(record.username),
      name: String(record.name)
    };
  });
}

export async function createVikunjaTask(input: VikunjaCompatTaskInput): Promise<VikunjaCompatTask> {
  await ensureVikunjaCompatSchema();
  const calendarDefaults = await loadCompatCalendarDefaults();

  const compatPayload: Record<string, unknown> = {
    compatibility: {
      source: "vikunja_api",
      project_id: input.projectId,
      ...(typeof input.description === "string" ? { description: input.description } : {}),
      ...(typeof input.dueDate === "string" ? { due_date: input.dueDate } : {}),
      ...(typeof input.priority === "number" ? { priority: input.priority } : {}),
      ...(typeof input.repeatAfter === "number" ? { repeat_after: input.repeatAfter } : {})
    }
  };

  let adapter: CalendarIntegrationAdapter = {
    async createEvent() {
      return {
        ok: false,
        errorCode: "service_unavailable",
        retryable: false,
        raw: { reason: "vikunja_compat_calendar_disabled" }
      };
    }
  };

  if (calendarDefaults.enabled) {
    try {
      const auth = resolveHomeAssistantAuthFromEnv();
      adapter = new HomeAssistantCalendarAdapter({
        baseUrl: auth.baseUrl,
        token: auth.token,
        timeoutMs: 8_000
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Missing HA credentials";
      adapter = {
        async createEvent() {
          return {
            ok: false,
            errorCode: "service_unavailable",
            retryable: false,
            raw: { reason: "vikunja_compat_calendar_credentials_missing", message }
          };
        }
      };
    }
  }

  const created = await createTaskAndSyncCalendar(
    {
      title: input.title,
      frameworkPayload: compatPayload,
      requestId: input.requestId,
      idempotencyKey: input.idempotencyKey,
      calendarDefaults
    },
    adapter
  );

  const now = Date.now();
  const client = getPersistenceClient();
  await client.execute({
    sql: `
      INSERT OR REPLACE INTO vikunja_task_meta(
        task_id, project_id, description, due_date, priority, repeat_after, created_at, updated_at
      ) VALUES(?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM vikunja_task_meta WHERE task_id = ?), ?), ?)
    `,
    args: [
      created.task.id,
      input.projectId,
      input.description ?? null,
      input.dueDate ?? null,
      input.priority ?? null,
      input.repeatAfter ?? null,
      created.task.id,
      now,
      now
    ]
  });

  const rowResult = await client.execute({
    sql: `
      SELECT m.task_id, t.title, m.description, m.project_id, m.due_date, m.priority, m.repeat_after, m.created_at, m.updated_at
      FROM vikunja_task_meta m
      JOIN tasks t ON t.id = m.task_id
      WHERE m.task_id = ?
      LIMIT 1
    `,
    args: [created.task.id]
  });

  const row = rowResult.rows[0] as Record<string, unknown>;
  return toTaskResponse(row);
}

export async function attachLabelToTask(taskId: string, labelId: number): Promise<boolean> {
  await ensureVikunjaCompatSchema();
  const existingTask = await findTaskById(taskId);
  if (!existingTask) {
    return false;
  }

  const client = getPersistenceClient();
  const label = await client.execute({
    sql: "SELECT id FROM vikunja_labels WHERE id = ? LIMIT 1",
    args: [labelId]
  });
  if (label.rows.length === 0) {
    return false;
  }

  await client.execute({
    sql: "INSERT OR IGNORE INTO vikunja_task_labels(task_id, label_id, created_at) VALUES(?, ?, ?)",
    args: [taskId, labelId, Date.now()]
  });
  return true;
}

export async function assignUserToTask(taskId: string, userId: number): Promise<boolean> {
  await ensureVikunjaCompatSchema();
  const existingTask = await findTaskById(taskId);
  if (!existingTask) {
    return false;
  }

  const client = getPersistenceClient();
  const user = await client.execute({
    sql: "SELECT id FROM vikunja_users WHERE id = ? LIMIT 1",
    args: [userId]
  });
  if (user.rows.length === 0) {
    return false;
  }

  await client.execute({
    sql: "INSERT OR IGNORE INTO vikunja_task_assignees(task_id, user_id, created_at) VALUES(?, ?, ?)",
    args: [taskId, userId, Date.now()]
  });
  return true;
}

export async function getVikunjaTask(taskId: string): Promise<VikunjaCompatTask | null> {
  await ensureVikunjaCompatSchema();
  const client = getPersistenceClient();
  const result = await client.execute({
    sql: `
      SELECT m.task_id, t.title, m.description, m.project_id, m.due_date, m.priority, m.repeat_after, m.created_at, m.updated_at
      FROM vikunja_task_meta m
      JOIN tasks t ON t.id = m.task_id
      WHERE m.task_id = ?
      LIMIT 1
    `,
    args: [taskId]
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? toTaskResponse(row) : null;
}

export function resetVikunjaCompatForTests(): void {
  compatEnsured = false;
}

export function parseUserQueryPage(value: string | null): number {
  const parsed = asNumber(value);
  return parsed && parsed > 0 ? parsed : 1;
}
