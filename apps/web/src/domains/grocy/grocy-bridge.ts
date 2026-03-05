/**
 * Grocy Bridge — Bidirectional Sync with Grocy
 *
 * Syncs Grocy chores + tasks → Meitheal tasks (inbound)
 * Pushes task completions → Grocy chore/task API (outbound)
 * Consolidates shopping list → single "Go Shopping" task
 *
 * Mirrors todo-bridge.ts pattern: polling timer, confirmations table,
 * no-sync/loop-prevention labels, start/stop/status methods.
 *
 * @domain grocy
 * @bounded-context integration
 */
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";
import { GrocyAdapter, type GrocyChore, type GrocyTask } from "@meitheal/integration-core";
import { choreToTask, taskToTask, shoppingListToTask } from "./grocy-mapper.js";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["integrations", "grocy"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: false,
});

const SYS_REQ = "grocy-sync";

// ═══════ Types ═══════

export interface GrocySyncConfig {
  syncEnabled: boolean;
  syncMode: "import" | "export" | "bidirectional";
  intervalMs: number;
}

interface GrocySyncState {
  config: GrocySyncConfig;
  adapter: GrocyAdapter | null;
  timer: ReturnType<typeof setInterval> | null;
  lastSyncAt: number | null;
  lastSyncError: string | null;
  itemCount: number;
  choreCount: number;
  taskCount: number;
  shoppingCount: number;
}

const state: GrocySyncState = {
  config: { syncEnabled: false, syncMode: "import", intervalMs: 15 * 60 * 1000 },
  adapter: null,
  timer: null,
  lastSyncAt: null,
  lastSyncError: null,
  itemCount: 0,
  choreCount: 0,
  taskCount: 0,
  shoppingCount: 0,
};

// ═══════ Lifecycle ═══════

/**
 * Start Grocy sync with polling timer.
 */
export function startGrocySync(config: GrocySyncConfig, adapter: GrocyAdapter): void {
  stopGrocySync();

  state.config = config;
  state.adapter = adapter;

  if (!config.syncEnabled) return;

  // Initial sync immediately
  syncFromGrocy().catch((err) => {
    logger.log("error", {
      event: "grocy.sync.initial_failed",
      domain: "integrations",
      component: "grocy-bridge",
      request_id: SYS_REQ,
      message: `Initial Grocy sync failed: ${err}`,
    });
  });

  // Set up polling timer (0 = manual only)
  if (config.intervalMs > 0) {
    state.timer = setInterval(() => {
      syncFromGrocy().catch((err) => {
        logger.log("error", {
          event: "grocy.sync.poll_failed",
          domain: "integrations",
          component: "grocy-bridge",
          request_id: SYS_REQ,
          message: `Grocy poll sync failed: ${err}`,
        });
      });
    }, config.intervalMs);
  }

  logger.log("info", {
    event: "grocy.sync.started",
    domain: "integrations",
    component: "grocy-bridge",
    request_id: SYS_REQ,
    message: `Grocy sync started (mode: ${config.syncMode}, interval: ${config.intervalMs}ms)`,
  });
}

/**
 * Stop Grocy sync and clean up timer.
 */
export function stopGrocySync(): void {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  state.config.syncEnabled = false;
  state.adapter = null;
}

/**
 * Get current sync status.
 */
export function getGrocySyncStatus() {
  return {
    active: state.config.syncEnabled && state.adapter !== null,
    syncMode: state.config.syncMode,
    intervalMs: state.config.intervalMs,
    lastSyncAt: state.lastSyncAt,
    lastSyncError: state.lastSyncError,
    itemCount: state.itemCount,
    choreCount: state.choreCount,
    taskCount: state.taskCount,
    shoppingCount: state.shoppingCount,
  };
}

/**
 * Get active config for outbound dispatcher checks.
 */
export function getActiveGrocySyncConfig(): GrocySyncConfig | null {
  if (!state.config.syncEnabled || !state.adapter) return null;
  return state.config;
}

// ═══════ Inbound: Grocy → Meitheal ═══════

/**
 * Pull chores, tasks, and shopping list from Grocy → create/update Meitheal tasks.
 */
export async function syncFromGrocy(): Promise<{
  chores: number;
  tasks: number;
  shopping: number;
  errors: number;
}> {
  const adapter = state.adapter;
  if (!adapter) {
    return { chores: 0, tasks: 0, shopping: 0, errors: 0 };
  }

  const result = { chores: 0, tasks: 0, shopping: 0, errors: 0 };

  // Only import if mode allows
  if (state.config.syncMode === "export") {
    return result;
  }

  // 1. Sync chores
  try {
    const choresResult = await adapter.getChores();
    if (choresResult.ok) {
      result.chores = await mergeGrocyChores(choresResult.data);
    } else {
      result.errors++;
      logger.log("error", {
        event: "grocy.sync.chores_failed",
        domain: "integrations",
        component: "grocy-bridge",
        request_id: SYS_REQ,
        message: `Failed to fetch chores: ${choresResult.message}`,
      });
    }
  } catch (err) {
    result.errors++;
    logger.log("error", {
      event: "grocy.sync.chores_error",
      domain: "integrations",
      component: "grocy-bridge",
      request_id: SYS_REQ,
      message: `Chore sync error: ${err}`,
    });
  }

  // 2. Sync tasks
  try {
    const tasksResult = await adapter.getTasks(false);
    if (tasksResult.ok) {
      result.tasks = await mergeGrocyTasks(tasksResult.data);
    } else {
      result.errors++;
      logger.log("error", {
        event: "grocy.sync.tasks_failed",
        domain: "integrations",
        component: "grocy-bridge",
        request_id: SYS_REQ,
        message: `Failed to fetch tasks: ${tasksResult.message}`,
      });
    }
  } catch (err) {
    result.errors++;
    logger.log("error", {
      event: "grocy.sync.tasks_error",
      domain: "integrations",
      component: "grocy-bridge",
      request_id: SYS_REQ,
      message: `Task sync error: ${err}`,
    });
  }

  // 3. Consolidate shopping list
  try {
    const shoppingResult = await adapter.getShoppingList();
    if (shoppingResult.ok && shoppingResult.data.length > 0) {
      result.shopping = await mergeShoppingList(shoppingResult.data as { id?: number; productId: number; amount: number; note?: string }[]);
    }
  } catch (err) {
    result.errors++;
    logger.log("error", {
      event: "grocy.sync.shopping_error",
      domain: "integrations",
      component: "grocy-bridge",
      request_id: SYS_REQ,
      message: `Shopping list sync error: ${err}`,
    });
  }

  // Update state
  state.lastSyncAt = Date.now();
  state.lastSyncError = result.errors > 0 ? `${result.errors} sync error(s)` : null;
  state.choreCount = result.chores;
  state.taskCount = result.tasks;
  state.shoppingCount = result.shopping;
  state.itemCount = result.chores + result.tasks + result.shopping;

  logger.log("info", {
    event: "grocy.sync.complete",
    domain: "integrations",
    component: "grocy-bridge",
    request_id: SYS_REQ,
    message: `Grocy sync: ${result.chores} chores, ${result.tasks} tasks, ${result.shopping} shopping — ${result.errors} errors`,
  });

  return result;
}

// ═══════ Outbound: Meitheal → Grocy ═══════

/**
 * Push a task completion to Grocy when a synced task is marked done.
 * Called by the outbound sync dispatcher for tasks with grocy confirmations.
 */
export async function pushCompletionToGrocy(taskId: string): Promise<boolean> {
  const adapter = state.adapter;
  if (!adapter) return false;

  if (state.config.syncMode === "import") return false;

  try {
    const { getPersistenceClient } = await import("@domains/tasks/persistence/store");
    const client = getPersistenceClient();

    // Look up the grocy sync confirmation for this task
    const row = await client.execute({
      sql: "SELECT grocy_entity_type, grocy_entity_id FROM grocy_sync_confirmations WHERE task_id = ? LIMIT 1",
      args: [taskId],
    });

    if (row.rows.length === 0) return false;

    const entityType = String(row.rows[0]!.grocy_entity_type);
    const entityId = Number(row.rows[0]!.grocy_entity_id);

    if (entityType === "chore") {
      const result = await adapter.trackChoreExecution(entityId);
      if (result.ok) {
        logger.log("info", {
          event: "grocy.sync.chore_completed",
          domain: "integrations",
          component: "grocy-bridge",
          request_id: SYS_REQ,
          message: `Marked chore ${entityId} as done in Grocy`,
        });
        return true;
      }
      logger.log("error", {
        event: "grocy.sync.chore_completion_failed",
        domain: "integrations",
        component: "grocy-bridge",
        request_id: SYS_REQ,
        message: `Failed to mark chore ${entityId} done: ${result.message}`,
      });
    } else if (entityType === "task") {
      const result = await adapter.markTaskCompleted(entityId);
      if (result.ok) {
        logger.log("info", {
          event: "grocy.sync.task_completed",
          domain: "integrations",
          component: "grocy-bridge",
          request_id: SYS_REQ,
          message: `Marked task ${entityId} as done in Grocy`,
        });
        return true;
      }
      logger.log("error", {
        event: "grocy.sync.task_completion_failed",
        domain: "integrations",
        component: "grocy-bridge",
        request_id: SYS_REQ,
        message: `Failed to mark task ${entityId} done: ${result.message}`,
      });
    }

    return false;
  } catch (err) {
    logger.log("error", {
      event: "grocy.sync.push_failed",
      domain: "integrations",
      component: "grocy-bridge",
      request_id: SYS_REQ,
      message: `Failed to push completion for task ${taskId}: ${err}`,
    });
    return false;
  }
}

// ═══════ Merge Helpers ═══════

async function mergeGrocyChores(chores: GrocyChore[]): Promise<number> {
  const { ensureSchema, getPersistenceClient } = await import("@domains/tasks/persistence/store");
  await ensureSchema();
  const client = getPersistenceClient();

  await ensureGrocySyncTable(client);

  let synced = 0;

  for (const chore of chores) {
    const entityKey = `chore:${chore.choreId}`;
    const taskData = choreToTask(chore);

    const existing = await client.execute({
      sql: "SELECT task_id FROM grocy_sync_confirmations WHERE grocy_entity_type = 'chore' AND grocy_entity_id = ?",
      args: [String(chore.choreId)],
    });

    const nowMs = Date.now();

    if (existing.rows.length > 0) {
      const taskId = existing.rows[0]!.task_id as string;

      // Check if locally modified
      const taskRow = await client.execute({
        sql: "SELECT updated_at FROM tasks WHERE id = ?",
        args: [taskId],
      });
      const syncRow = await client.execute({
        sql: "SELECT updated_at FROM grocy_sync_confirmations WHERE grocy_entity_type = 'chore' AND grocy_entity_id = ?",
        args: [String(chore.choreId)],
      });

      const taskUpdatedAt = (taskRow.rows[0]?.updated_at as number) ?? 0;
      const lastSyncAt = (syncRow.rows[0]?.updated_at as number) ?? 0;

      if (taskUpdatedAt > lastSyncAt) continue; // Skip — locally modified

      await client.execute({
        sql: `UPDATE tasks SET title = ?, status = ?, due_date = ?, description = COALESCE(?, description), updated_at = ? WHERE id = ?`,
        args: [taskData.title, taskData.status, taskData.dueDate, taskData.description, nowMs, taskId],
      });

      await client.execute({
        sql: "UPDATE grocy_sync_confirmations SET payload = ?, updated_at = ? WHERE grocy_entity_type = 'chore' AND grocy_entity_id = ?",
        args: [JSON.stringify(chore), nowMs, String(chore.choreId)],
      });

      synced++;
    } else {
      // Create new task
      const taskId = crypto.randomUUID();
      const reqId = crypto.randomUUID();

      await client.execute({
        sql: `INSERT INTO tasks (id, title, description, status, priority, due_date,
                labels, framework_payload, calendar_sync_state, board_id,
                custom_fields, task_type, idempotency_key, request_id,
                created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, '{}', 'synced', 'default', '{}', 'task', ?, ?, ?, ?)`,
        args: [
          taskId, taskData.title, taskData.description ?? "", taskData.status,
          taskData.priority, taskData.dueDate,
          JSON.stringify(taskData.labels),
          `grocy-chore-${chore.choreId}`, reqId, nowMs, nowMs,
        ],
      });

      await client.execute({
        sql: `INSERT INTO grocy_sync_confirmations (confirmation_id, task_id, grocy_entity_type, grocy_entity_id, sync_direction, payload, created_at, updated_at)
              VALUES (?, ?, 'chore', ?, 'inbound', ?, ?, ?)`,
        args: [crypto.randomUUID(), taskId, String(chore.choreId), JSON.stringify(chore), nowMs, nowMs],
      });

      synced++;
    }
  }

  return synced;
}

async function mergeGrocyTasks(tasks: GrocyTask[]): Promise<number> {
  const { ensureSchema, getPersistenceClient } = await import("@domains/tasks/persistence/store");
  await ensureSchema();
  const client = getPersistenceClient();

  await ensureGrocySyncTable(client);

  let synced = 0;

  for (const task of tasks) {
    const taskData = taskToTask(task);

    const existing = await client.execute({
      sql: "SELECT task_id FROM grocy_sync_confirmations WHERE grocy_entity_type = 'task' AND grocy_entity_id = ?",
      args: [String(task.taskId)],
    });

    const nowMs = Date.now();

    if (existing.rows.length > 0) {
      const meithealTaskId = existing.rows[0]!.task_id as string;

      // Check if locally modified
      const taskRow = await client.execute({
        sql: "SELECT updated_at FROM tasks WHERE id = ?",
        args: [meithealTaskId],
      });
      const syncRow = await client.execute({
        sql: "SELECT updated_at FROM grocy_sync_confirmations WHERE grocy_entity_type = 'task' AND grocy_entity_id = ?",
        args: [String(task.taskId)],
      });

      const taskUpdatedAt = (taskRow.rows[0]?.updated_at as number) ?? 0;
      const lastSyncAt = (syncRow.rows[0]?.updated_at as number) ?? 0;

      if (taskUpdatedAt > lastSyncAt) continue;

      await client.execute({
        sql: `UPDATE tasks SET title = ?, status = ?, due_date = ?, description = COALESCE(?, description), updated_at = ? WHERE id = ?`,
        args: [taskData.title, taskData.status, taskData.dueDate, taskData.description, nowMs, meithealTaskId],
      });

      await client.execute({
        sql: "UPDATE grocy_sync_confirmations SET payload = ?, updated_at = ? WHERE grocy_entity_type = 'task' AND grocy_entity_id = ?",
        args: [JSON.stringify(task), nowMs, String(task.taskId)],
      });

      synced++;
    } else {
      const meithealTaskId = crypto.randomUUID();
      const reqId = crypto.randomUUID();

      await client.execute({
        sql: `INSERT INTO tasks (id, title, description, status, priority, due_date,
                labels, framework_payload, calendar_sync_state, board_id,
                custom_fields, task_type, idempotency_key, request_id,
                created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, '{}', 'synced', 'default', '{}', 'task', ?, ?, ?, ?)`,
        args: [
          meithealTaskId, taskData.title, taskData.description ?? "", taskData.status,
          taskData.priority, taskData.dueDate,
          JSON.stringify(taskData.labels),
          `grocy-task-${task.taskId}`, reqId, nowMs, nowMs,
        ],
      });

      await client.execute({
        sql: `INSERT INTO grocy_sync_confirmations (confirmation_id, task_id, grocy_entity_type, grocy_entity_id, sync_direction, payload, created_at, updated_at)
              VALUES (?, ?, 'task', ?, 'inbound', ?, ?, ?)`,
        args: [crypto.randomUUID(), meithealTaskId, String(task.taskId), JSON.stringify(task), nowMs, nowMs],
      });

      synced++;
    }
  }

  return synced;
}

async function mergeShoppingList(items: { id?: number; productId: number; amount: number; note?: string }[]): Promise<number> {
  const { ensureSchema, getPersistenceClient } = await import("@domains/tasks/persistence/store");
  await ensureSchema();
  const client = getPersistenceClient();

  await ensureGrocySyncTable(client);

  const taskData = shoppingListToTask(items);
  const nowMs = Date.now();

  // Check for existing shopping task
  const existing = await client.execute({
    sql: "SELECT task_id FROM grocy_sync_confirmations WHERE grocy_entity_type = 'shopping' AND grocy_entity_id = 'list-1'",
    args: [],
  });

  if (existing.rows.length > 0) {
    const taskId = existing.rows[0]!.task_id as string;

    // Always update shopping task with latest count
    await client.execute({
      sql: `UPDATE tasks SET title = ?, description = ?, status = 'todo', updated_at = ? WHERE id = ?`,
      args: [taskData.title, taskData.description, nowMs, taskId],
    });

    await client.execute({
      sql: "UPDATE grocy_sync_confirmations SET payload = ?, updated_at = ? WHERE grocy_entity_type = 'shopping' AND grocy_entity_id = 'list-1'",
      args: [JSON.stringify({ itemCount: items.length }), nowMs],
    });

    return 1;
  }

  // Create new shopping task
  const taskId = crypto.randomUUID();
  const reqId = crypto.randomUUID();

  await client.execute({
    sql: `INSERT INTO tasks (id, title, description, status, priority, due_date,
            labels, framework_payload, calendar_sync_state, board_id,
            custom_fields, task_type, idempotency_key, request_id,
            created_at, updated_at)
          VALUES (?, ?, ?, 'todo', 3, NULL, ?, '{}', 'synced', 'default', '{}', 'task', ?, ?, ?, ?)`,
    args: [
      taskId, taskData.title, taskData.description,
      JSON.stringify(taskData.labels),
      `grocy-shopping-list-1`, reqId, nowMs, nowMs,
    ],
  });

  await client.execute({
    sql: `INSERT INTO grocy_sync_confirmations (confirmation_id, task_id, grocy_entity_type, grocy_entity_id, sync_direction, payload, created_at, updated_at)
          VALUES (?, ?, 'shopping', 'list-1', 'inbound', ?, ?, ?)`,
    args: [crypto.randomUUID(), taskId, JSON.stringify({ itemCount: items.length }), nowMs, nowMs],
  });

  return 1;
}

// ═══════ Table Bootstrap ═══════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureGrocySyncTable(client: any): Promise<void> {
  await client.execute({
    sql: `CREATE TABLE IF NOT EXISTS grocy_sync_confirmations (
      confirmation_id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      grocy_entity_type TEXT NOT NULL,
      grocy_entity_id TEXT NOT NULL,
      sync_direction TEXT NOT NULL DEFAULT 'inbound',
      payload TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    args: [],
  });
  await client.execute({
    sql: `CREATE INDEX IF NOT EXISTS idx_grocy_sync_entity ON grocy_sync_confirmations(grocy_entity_type, grocy_entity_id)`,
    args: [],
  });
  await client.execute({
    sql: `CREATE INDEX IF NOT EXISTS idx_grocy_sync_task ON grocy_sync_confirmations(task_id)`,
    args: [],
  });
}
