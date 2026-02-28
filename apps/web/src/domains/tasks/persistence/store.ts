import { mkdirSync } from "node:fs";
import path from "node:path";
import { type Client, createClient } from "@libsql/client";
import type { CalendarResult } from "@meitheal/integration-core";
import type { CalendarSyncState, CreateTaskPlan, IntegrationOutcome } from "@meitheal/domain-tasks";
import { drizzle } from "drizzle-orm/libsql";

export interface PersistedTask {
  id: string;
  title: string;
  status: string;
  frameworkPayload: Record<string, unknown>;
  calendarSyncState: CalendarSyncState;
  idempotencyKey: string;
  requestId: string;
  createdAt: number;
  updatedAt: number;
}

export interface PersistedTaskResponse {
  task: PersistedTask;
  integration: IntegrationOutcome;
}

let clientSingleton: Client | null = null;
let dbSingleton: ReturnType<typeof drizzle> | null = null;
let ensured = false;

function resolveDbUrl(): string {
  return process.env.MEITHEAL_DB_URL ?? "file:./.data/meitheal.db";
}

function ensureFileDbDirectory(dbUrl: string): void {
  if (!dbUrl.startsWith("file:")) {
    return;
  }

  const dbPath = dbUrl.slice("file:".length);
  const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
}

function getClient(): Client {
  if (clientSingleton) {
    return clientSingleton;
  }

  const dbUrl = resolveDbUrl();
  ensureFileDbDirectory(dbUrl);
  clientSingleton = createClient({ url: dbUrl });
  dbSingleton = drizzle(clientSingleton);
  return clientSingleton;
}

export function getDb() {
  if (dbSingleton) {
    return dbSingleton;
  }
  getClient();
  if (!dbSingleton) {
    throw new Error("Failed to initialize Drizzle client");
  }
  return dbSingleton;
}

export function getPersistenceClient(): Client {
  return getClient();
}

function toTask(row: Record<string, unknown>): PersistedTask {
  return {
    id: String(row.id),
    title: String(row.title),
    status: String(row.status),
    frameworkPayload:
      typeof row.framework_payload === "string"
        ? (JSON.parse(row.framework_payload) as Record<string, unknown>)
        : (row.framework_payload as Record<string, unknown>) ?? {},
    calendarSyncState: String(row.calendar_sync_state) as CalendarSyncState,
    idempotencyKey: String(row.idempotency_key),
    requestId: String(row.request_id),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

function toIntegrationOutcomeFromStored(params: {
  calendarSyncState: CalendarSyncState;
  confirmationId?: string;
  errorCode?: string;
  retryAfterSeconds?: number;
}): IntegrationOutcome {
  return {
    calendarSyncState: params.calendarSyncState,
    ...(params.confirmationId ? { confirmationId: params.confirmationId } : {}),
    ...(params.errorCode ? { errorCode: params.errorCode } : {}),
    ...(typeof params.retryAfterSeconds === "number"
      ? { retryAfterSeconds: params.retryAfterSeconds }
      : {})
  };
}

async function withTransaction<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = getClient();
  await client.execute("BEGIN");
  try {
    const result = await fn(client);
    await client.execute("COMMIT");
    return result;
  } catch (error) {
    await client.execute("ROLLBACK");
    throw error;
  }
}

async function hasColumn(client: Client, tableName: string, columnName: string): Promise<boolean> {
  const result = await client.execute(`PRAGMA table_info(${tableName})`);
  return result.rows.some((row) => String((row as Record<string, unknown>).name) === columnName);
}

export async function ensureSchema(): Promise<void> {
  if (ensured) {
    return;
  }

  const client = getClient();

  await client.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      endeavor_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      framework_payload TEXT NOT NULL DEFAULT '{}',
      calendar_sync_state TEXT NOT NULL DEFAULT 'pending',
      idempotency_key TEXT NOT NULL UNIQUE,
      request_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS domain_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      task_id TEXT NOT NULL,
      request_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS integration_attempts (
      attempt_id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      integration TEXT NOT NULL,
      request_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      status TEXT NOT NULL,
      error_code TEXT,
      retry_after_seconds INTEGER,
      response_payload TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(idempotency_key, integration)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS calendar_confirmations (
      confirmation_id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      request_id TEXT NOT NULL,
      provider_event_id TEXT,
      source TEXT NOT NULL DEFAULT 'ha.create_event',
      payload TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(task_id, request_id)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS audit_trail (
      audit_id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      event_id TEXT,
      task_id TEXT,
      integration TEXT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  await client.execute("CREATE INDEX IF NOT EXISTS tasks_request_idx ON tasks(request_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS tasks_calendar_sync_state_idx ON tasks(calendar_sync_state)");
  await client.execute("CREATE INDEX IF NOT EXISTS tasks_created_idx ON tasks(created_at)");
  await client.execute("CREATE INDEX IF NOT EXISTS domain_events_task_idx ON domain_events(task_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS domain_events_request_idx ON domain_events(request_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS domain_events_created_idx ON domain_events(created_at)");
  await client.execute("CREATE INDEX IF NOT EXISTS integration_attempts_task_idx ON integration_attempts(task_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS integration_attempts_request_idx ON integration_attempts(request_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS calendar_confirmations_task_idx ON calendar_confirmations(task_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS calendar_confirmations_request_idx ON calendar_confirmations(request_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS audit_trail_request_idx ON audit_trail(request_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS audit_trail_task_idx ON audit_trail(task_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS audit_trail_created_idx ON audit_trail(created_at)");

  if (!(await hasColumn(client, "integration_attempts", "updated_at"))) {
    await client.execute("ALTER TABLE integration_attempts ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0");
    await client.execute("UPDATE integration_attempts SET updated_at = created_at WHERE updated_at = 0");
  }

  // Phase 6: UI columns
  if (!(await hasColumn(client, "tasks", "priority"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 3");
  }
  if (!(await hasColumn(client, "tasks", "due_date"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN due_date TEXT");
  }
  if (!(await hasColumn(client, "tasks", "labels"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN labels TEXT NOT NULL DEFAULT '[]'");
  }

  // Phase 14: Subtasks + Time tracking
  if (!(await hasColumn(client, "tasks", "parent_id"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN parent_id TEXT");
  }
  if (!(await hasColumn(client, "tasks", "time_tracked"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN time_tracked INTEGER NOT NULL DEFAULT 0");
  }

  // Phase 15: Boards for DDD domain separation
  await client.execute(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📋',
      color TEXT NOT NULL DEFAULT '#10b981',
      position INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Auto-create default board if none exist
  const boardCount = await client.execute("SELECT COUNT(*) as cnt FROM boards");
  if (Number(boardCount.rows[0]?.cnt ?? 0) === 0) {
    const now = Date.now();
    await client.execute({
      sql: "INSERT INTO boards (id, title, icon, color, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: ["default", "Default", "📋", "#10b981", 0, now, now],
    });
  }

  // Add board_id to tasks
  if (!(await hasColumn(client, "tasks", "board_id"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN board_id TEXT NOT NULL DEFAULT 'default'");
    await client.execute("UPDATE tasks SET board_id = 'default' WHERE board_id = 'default'");
  }

  // Custom fields JSON storage per task
  if (!(await hasColumn(client, "tasks", "custom_fields"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN custom_fields TEXT NOT NULL DEFAULT '{}'");
  }

  // Phase 18: Vikunja card parity — extended task fields
  if (!(await hasColumn(client, "tasks", "start_date"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN start_date TEXT");
  }
  if (!(await hasColumn(client, "tasks", "end_date"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN end_date TEXT");
  }
  if (!(await hasColumn(client, "tasks", "progress"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN progress INTEGER NOT NULL DEFAULT 0");
  }
  if (!(await hasColumn(client, "tasks", "color"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN color TEXT");
  }
  if (!(await hasColumn(client, "tasks", "is_favorite"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0");
  }

  // Phase 20: Agile hierarchy — epic/story/task type
  if (!(await hasColumn(client, "tasks", "task_type"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN task_type TEXT NOT NULL DEFAULT 'task'");
  }
  await client.execute("CREATE INDEX IF NOT EXISTS tasks_task_type_idx ON tasks(task_type)");

  // Phase 27: Summary field for card subtitles
  if (!(await hasColumn(client, "tasks", "summary"))) {
    await client.execute("ALTER TABLE tasks ADD COLUMN summary TEXT");
  }


  // Phase 18: Comments table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Kanban swim lanes — server-persisted lane configuration
  await client.execute(`
    CREATE TABLE IF NOT EXISTS kanban_lanes (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📌',
      position INTEGER NOT NULL DEFAULT 0,
      wip_limit INTEGER NOT NULL DEFAULT 0,
      includes TEXT NOT NULL DEFAULT '[]',
      built_in INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Seed default lanes if none exist
  const laneCount = await client.execute("SELECT COUNT(*) as cnt FROM kanban_lanes");
  if (Number(laneCount.rows[0]?.cnt ?? 0) === 0) {
    const now = Date.now();
    const defaultLanes = [
      { id: "lane-pending", key: "pending", label: "Pending", icon: "📋", position: 0, includes: '["pending","todo"]', builtIn: 1 },
      { id: "lane-active", key: "active", label: "Active", icon: "⚡", position: 1, includes: '["active","in_progress"]', builtIn: 1 },
      { id: "lane-complete", key: "complete", label: "Complete", icon: "✅", position: 2, includes: '["complete","done"]', builtIn: 1 },
    ];
    for (const lane of defaultLanes) {
      await client.execute({
        sql: "INSERT INTO kanban_lanes (id, key, label, icon, position, wip_limit, includes, built_in, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)",
        args: [lane.id, lane.key, lane.label, lane.icon, lane.position, lane.includes, lane.builtIn, now, now],
      });
    }
  }

  await client.execute("CREATE INDEX IF NOT EXISTS kanban_lanes_position_idx ON kanban_lanes(position)");

  await client.execute("CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status)");
  await client.execute("CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority)");
  await client.execute("CREATE INDEX IF NOT EXISTS tasks_parent_id_idx ON tasks(parent_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS tasks_board_id_idx ON tasks(board_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS comments_task_id_idx ON comments(task_id)");

  ensured = true;

}

export async function findByIdempotencyKey(idempotencyKey: string): Promise<PersistedTaskResponse | null> {
  const client = getClient();
  const taskResult = await client.execute({
    sql: `
      SELECT id, title, status, framework_payload, calendar_sync_state, idempotency_key, request_id, created_at, updated_at
      FROM tasks
      WHERE idempotency_key = ?
      LIMIT 1
    `,
    args: [idempotencyKey]
  });

  const taskRow = taskResult.rows[0] as Record<string, unknown> | undefined;
  if (!taskRow) {
    return null;
  }

  const task = toTask(taskRow);

  const confirmationResult = await client.execute({
    sql: `
      SELECT confirmation_id
      FROM calendar_confirmations
      WHERE task_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    args: [task.id]
  });

  const attemptResult = await client.execute({
    sql: `
      SELECT error_code, retry_after_seconds
      FROM integration_attempts
      WHERE task_id = ? AND integration = 'calendar'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    args: [task.id]
  });

  const confirmationRow = confirmationResult.rows[0] as Record<string, unknown> | undefined;
  const attemptRow = attemptResult.rows[0] as Record<string, unknown> | undefined;

  return {
    task,
    integration: toIntegrationOutcomeFromStored({
      calendarSyncState: task.calendarSyncState,
      ...(typeof confirmationRow?.confirmation_id === "string"
        ? { confirmationId: confirmationRow.confirmation_id }
        : {}),
      ...(typeof attemptRow?.error_code === "string" ? { errorCode: attemptRow.error_code } : {}),
      ...(typeof attemptRow?.retry_after_seconds === "number"
        ? { retryAfterSeconds: attemptRow.retry_after_seconds }
        : {})
    })
  };
}

export async function findTaskById(taskId: string): Promise<PersistedTask | null> {
  const client = getClient();
  const taskResult = await client.execute({
    sql: `
      SELECT id, title, status, framework_payload, calendar_sync_state, idempotency_key, request_id, created_at, updated_at
      FROM tasks
      WHERE id = ?
      LIMIT 1
    `,
    args: [taskId]
  });

  const taskRow = taskResult.rows[0] as Record<string, unknown> | undefined;
  if (!taskRow) {
    return null;
  }
  return toTask(taskRow);
}

export async function persistInitialPlan(plan: CreateTaskPlan): Promise<void> {
  const now = Date.now();

  await withTransaction(async (client) => {
    await client.execute({
      sql: `
        INSERT INTO tasks(
          id, title, status, framework_payload, calendar_sync_state,
          idempotency_key, request_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        plan.aggregate.task.id,
        plan.aggregate.task.title,
        plan.aggregate.task.status,
        JSON.stringify(plan.aggregate.task.frameworkPayload),
        plan.aggregate.calendarSyncState,
        plan.aggregate.idempotencyKey,
        plan.aggregate.requestId,
        now,
        now
      ]
    });

    for (const event of plan.events) {
      await client.execute({
        sql: `
          INSERT INTO domain_events(event_id, event_type, task_id, request_id, idempotency_key, payload, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          event.eventId,
          event.eventType,
          plan.aggregate.task.id,
          event.requestId,
          plan.aggregate.idempotencyKey,
          JSON.stringify(event.payload),
          now
        ]
      });
    }

    await client.execute({
      sql: `
        INSERT INTO integration_attempts(
          attempt_id, task_id, integration, request_id, idempotency_key, status, created_at, updated_at
        ) VALUES (?, ?, 'calendar', ?, ?, 'pending', ?, ?)
      `,
      args: [crypto.randomUUID(), plan.aggregate.task.id, plan.aggregate.requestId, plan.aggregate.idempotencyKey, now, now]
    });

    await client.execute({
      sql: `
        INSERT INTO audit_trail(audit_id, request_id, task_id, integration, level, message, metadata, created_at)
        VALUES (?, ?, ?, 'calendar', 'info', ?, ?, ?)
      `,
      args: [
        crypto.randomUUID(),
        plan.aggregate.requestId,
        plan.aggregate.task.id,
        "Task persisted and calendar sync marked pending",
        JSON.stringify({ idempotencyKey: plan.aggregate.idempotencyKey }),
        now
      ]
    });
  });
}

export async function persistCalendarIntegrationResult(params: {
  taskId: string;
  requestId: string;
  idempotencyKey: string;
  result: CalendarResult;
}): Promise<PersistedTaskResponse> {
  const now = Date.now();

  await withTransaction(async (client) => {
    if (params.result.ok) {
      await client.execute({
        sql: `
          UPDATE tasks SET calendar_sync_state = 'confirmed', updated_at = ?
          WHERE id = ?
        `,
        args: [now, params.taskId]
      });

      await client.execute({
        sql: `
          UPDATE integration_attempts
          SET status = 'succeeded', response_payload = ?, updated_at = ?
          WHERE task_id = ? AND integration = 'calendar'
        `,
        args: [JSON.stringify(params.result.raw ?? null), now, params.taskId]
      });

      await client.execute({
        sql: `
          INSERT OR IGNORE INTO calendar_confirmations(
            confirmation_id, task_id, request_id, provider_event_id, source, payload, created_at
          ) VALUES (?, ?, ?, ?, 'ha.create_event', ?, ?)
        `,
        args: [
          params.result.confirmationId,
          params.taskId,
          params.requestId,
          params.result.providerEventId ?? null,
          JSON.stringify(params.result.raw ?? null),
          now
        ]
      });

      await client.execute({
        sql: `
          INSERT INTO domain_events(event_id, event_type, task_id, request_id, idempotency_key, payload, created_at)
          VALUES (?, 'integration.sync.completed', ?, ?, ?, ?, ?)
        `,
        args: [
          crypto.randomUUID(),
          params.taskId,
          params.requestId,
          params.idempotencyKey,
          JSON.stringify({ integration: "calendar", confirmationId: params.result.confirmationId }),
          now
        ]
      });

      await client.execute({
        sql: `
          INSERT INTO audit_trail(audit_id, request_id, task_id, integration, level, message, metadata, created_at)
          VALUES (?, ?, ?, 'calendar', 'info', 'Calendar event confirmed', ?, ?)
        `,
        args: [
          crypto.randomUUID(),
          params.requestId,
          params.taskId,
          JSON.stringify({ confirmationId: params.result.confirmationId }),
          now
        ]
      });

      return;
    }

    const failedState = params.result.retryable ? "failed_retryable" : "failed_terminal";

    await client.execute({
      sql: `
        UPDATE tasks SET calendar_sync_state = ?, updated_at = ?
        WHERE id = ?
      `,
      args: [failedState, now, params.taskId]
    });

    await client.execute({
      sql: `
        UPDATE integration_attempts
        SET status = 'failed', error_code = ?, retry_after_seconds = ?, response_payload = ?, updated_at = ?
        WHERE task_id = ? AND integration = 'calendar'
      `,
      args: [
        params.result.errorCode,
        params.result.retryAfterSeconds ?? null,
        JSON.stringify(params.result.raw ?? null),
        now,
        params.taskId
      ]
    });

    await client.execute({
      sql: `
        INSERT INTO audit_trail(audit_id, request_id, task_id, integration, level, message, metadata, created_at)
        VALUES (?, ?, ?, 'calendar', 'warn', 'Calendar sync failed', ?, ?)
      `,
      args: [
        crypto.randomUUID(),
        params.requestId,
        params.taskId,
        JSON.stringify({
          errorCode: params.result.errorCode,
          retryAfterSeconds: params.result.retryAfterSeconds,
          retryable: params.result.retryable
        }),
        now
      ]
    });
  });

  const persisted = await findByIdempotencyKey(params.idempotencyKey);
  if (!persisted) {
    throw new Error(`Unable to reload persisted task for idempotency key ${params.idempotencyKey}`);
  }

  return persisted;
}

export async function persistManualCalendarConfirmation(params: {
  taskId: string;
  requestId: string;
  confirmationId: string;
  providerEventId?: string;
  payload?: unknown;
}): Promise<{ confirmationId: string; alreadyExisted: boolean }> {
  const client = getClient();
  const task = await findTaskById(params.taskId);
  if (!task) {
    throw new Error(`TASK_NOT_FOUND:${params.taskId}`);
  }

  const existingResult = await client.execute({
    sql: `
      SELECT confirmation_id
      FROM calendar_confirmations
      WHERE task_id = ? AND confirmation_id = ?
      LIMIT 1
    `,
    args: [params.taskId, params.confirmationId]
  });

  const existing = existingResult.rows[0] as Record<string, unknown> | undefined;
  if (existing) {
    return { confirmationId: String(existing.confirmation_id), alreadyExisted: true };
  }

  const now = Date.now();
  await withTransaction(async (txClient) => {
    await txClient.execute({
      sql: `
        INSERT INTO calendar_confirmations(
          confirmation_id, task_id, request_id, provider_event_id, source, payload, created_at
        ) VALUES (?, ?, ?, ?, 'manual.confirmation', ?, ?)
      `,
      args: [
        params.confirmationId,
        params.taskId,
        params.requestId,
        params.providerEventId ?? null,
        JSON.stringify(params.payload ?? null),
        now
      ]
    });

    await txClient.execute({
      sql: `
        UPDATE tasks
        SET calendar_sync_state = 'confirmed', updated_at = ?
        WHERE id = ?
      `,
      args: [now, params.taskId]
    });

    await txClient.execute({
      sql: `
        INSERT INTO audit_trail(audit_id, request_id, task_id, integration, level, message, metadata, created_at)
        VALUES (?, ?, ?, 'calendar', 'info', 'Manual calendar confirmation persisted', ?, ?)
      `,
      args: [
        crypto.randomUUID(),
        params.requestId,
        params.taskId,
        JSON.stringify({ confirmationId: params.confirmationId, providerEventId: params.providerEventId }),
        now
      ]
    });
  });

  return { confirmationId: params.confirmationId, alreadyExisted: false };
}

export function resetPersistenceForTests(): void {
  clientSingleton = null;
  dbSingleton = null;
  ensured = false;
}
