/**
 * Todo Bridge — Bidirectional Sync with HA Todo Entities
 *
 * Syncs Meitheal tasks with HA todo list entities:
 *   - HA todo → Meitheal: subscription-based real-time sync
 *   - Meitheal → HA: task create/update pushes to HA todo entity
 *
 * Mirrors the calendar-bridge.ts pattern but uses WebSocket subscriptions
 * instead of polling for real-time updates.
 *
 * @domain todo
 * @bounded-context integration
 */
import {
  getTodoItems,
  addTodoItem,
  updateTodoItem,
  removeTodoItem,
  subscribeTodoItems,
  type TodoItem,
} from "../ha";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";
import {
  haStatusToMeitheal,
  meithealStatusToHA,
  buildDueServiceData,
  type HATodoItem,
} from "./todo-status-mapper";

const logger = createLogger({
  service: "meitheal-web", env: process.env.NODE_ENV ?? "development",
  minLevel: "info", enabledCategories: ["ha", "todo"],
  redactPatterns: defaultRedactionPatterns, auditEnabled: false,
});
const SYS_REQ = "ha-system";

export interface TodoSyncConfig {
  entityId: string;
  syncEnabled: boolean;
  writeBack: boolean;
  syncDirection: "inbound" | "outbound" | "bidirectional";
}

interface TodoSyncState {
  config: TodoSyncConfig;
  unsub: (() => void) | null;
  lastSyncAt: number | null;
  itemCount: number;
}

const activeSyncs: Map<string, TodoSyncState> = new Map();

/**
 * Initialize todo sync with one or more HA todo entities.
 */
export function startTodoSync(configs: TodoSyncConfig | TodoSyncConfig[]): void {
  const configList = Array.isArray(configs) ? configs : [configs];

  for (const config of configList) {
    // Stop existing sync for this entity if active
    const existing = activeSyncs.get(config.entityId);
    if (existing?.unsub) existing.unsub();

    if (!config.syncEnabled) {
      activeSyncs.delete(config.entityId);
      continue;
    }

    const state: TodoSyncState = {
      config,
      unsub: null,
      lastSyncAt: null,
      itemCount: 0,
    };
    activeSyncs.set(config.entityId, state);

    // Subscribe to real-time updates via WebSocket
    if (config.syncDirection !== "outbound") {
      subscribeTodoItems(config.entityId, async (items: TodoItem[]) => {
        logger.log("info", {
          event: "todo.sync.ws_update", domain: "todo", component: "todo-bridge",
          request_id: SYS_REQ,
          message: `Real-time update: ${items.length} items from ${config.entityId}`,
        });
        state.itemCount = items.length;
        await mergeHATodoItems(config.entityId, items as HATodoItem[]);
      }).then((unsub: () => void) => {
        state.unsub = unsub;
      }).catch((err: unknown) => {
        logger.log("error", {
          event: "todo.sync.subscribe_failed", domain: "todo", component: "todo-bridge",
          request_id: SYS_REQ, message: `Failed to subscribe to ${config.entityId}: ${err}`,
        });
      });
    }

    // Initial full sync
    syncTodoFromHA(config.entityId).catch((err) => {
      logger.log("error", {
        event: "todo.sync.initial_failed", domain: "todo", component: "todo-bridge",
        request_id: SYS_REQ, message: `Initial todo sync failed for ${config.entityId}: ${err}`,
      });
    });

    logger.log("info", {
      event: "todo.sync.started", domain: "todo", component: "todo-bridge",
      request_id: SYS_REQ,
      message: `Todo sync started for ${config.entityId} (direction: ${config.syncDirection})`,
    });
  }
}

/**
 * Sync items FROM a specific HA todo entity TO Meitheal tasks table.
 */
export async function syncTodoFromHA(entityId?: string): Promise<void> {
  const targets = entityId
    ? [activeSyncs.get(entityId)].filter(Boolean) as TodoSyncState[]
    : Array.from(activeSyncs.values()).filter((s) => s.config.syncDirection !== "outbound");

  for (const state of targets) {
    const { config } = state;

    try {
      const items = await getTodoItems(config.entityId);
      if (items.length === 0) {
        logger.log("debug", {
          event: "todo.sync.from_ha", domain: "todo", component: "todo-bridge",
          request_id: SYS_REQ, message: `No items to sync from ${config.entityId}`,
        });
        continue;
      }

      await mergeHATodoItems(config.entityId, items as HATodoItem[]);
      state.lastSyncAt = Date.now();
      state.itemCount = items.length;
    } catch (err) {
      logger.log("error", {
        event: "todo.sync.from_ha.failed", domain: "todo", component: "todo-bridge",
        request_id: SYS_REQ, message: `Failed to sync from ${config.entityId}: ${err}`,
      });
    }
  }
}

/**
 * Merge HA todo items into Meitheal tasks table with deduplication.
 */
async function mergeHATodoItems(entityId: string, items: HATodoItem[]): Promise<void> {
  try {
    const { ensureSchema, getPersistenceClient } = await import("@domains/tasks/persistence/store");
    await ensureSchema();
    const client = getPersistenceClient();

    // Ensure todo_sync_confirmations table exists
    await client.execute({
      sql: `CREATE TABLE IF NOT EXISTS todo_sync_confirmations (
        confirmation_id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        ha_entity_id TEXT NOT NULL,
        ha_todo_uid TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'ha.todo_sync',
        sync_direction TEXT NOT NULL DEFAULT 'inbound',
        payload TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      args: [],
    });
    await client.execute({
      sql: `CREATE INDEX IF NOT EXISTS idx_todo_sync_entity_uid ON todo_sync_confirmations(ha_entity_id, ha_todo_uid)`,
      args: [],
    });
    await client.execute({
      sql: `CREATE INDEX IF NOT EXISTS idx_todo_sync_task ON todo_sync_confirmations(task_id)`,
      args: [],
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const uid = item.uid ?? `ha-todo-${entityId}-${item.summary}`;
      const meithealStatus = haStatusToMeitheal(item.status ?? "needs_action");

      // Check if we already track this todo item
      const existing = await client.execute({
        sql: "SELECT task_id FROM todo_sync_confirmations WHERE ha_entity_id = ? AND ha_todo_uid = ?",
        args: [entityId, uid],
      });

      if (existing.rows.length > 0) {
        // Update existing task
        const taskId = existing.rows[0]!.task_id as string;
        const nowMs = Date.now();
        await client.execute({
          sql: `UPDATE tasks SET
            title = ?,
            status = ?,
            due_date = ?,
            description = COALESCE(?, description),
            updated_at = ?
          WHERE id = ?`,
          args: [
            item.summary,
            meithealStatus,
            item.due ?? null,
            item.description ?? null,
            nowMs,
            taskId,
          ],
        });

        // Update sync confirmation
        await client.execute({
          sql: "UPDATE todo_sync_confirmations SET payload = ?, updated_at = ? WHERE ha_entity_id = ? AND ha_todo_uid = ?",
          args: [
            JSON.stringify({ summary: item.summary, status: item.status, due: item.due }),
            nowMs,
            entityId,
            uid,
          ],
        });

        updated++;
      } else {
        // Create new task from todo item
        const taskId = crypto.randomUUID();
        const reqId = crypto.randomUUID();
        const nowMs = Date.now();

        await client.execute({
          sql: `INSERT INTO tasks (id, title, description, status, priority, due_date,
                  labels, framework_payload, calendar_sync_state, board_id,
                  custom_fields, task_type, idempotency_key, request_id,
                  created_at, updated_at)
                VALUES (?, ?, ?, ?, 3, ?, '[]', '{}', 'synced', 'default',
                  '{}', 'task', ?, ?, ?, ?)`,
          args: [
            taskId,
            item.summary,
            item.description ?? "",
            meithealStatus,
            item.due ?? null,
            `todo-sync-${uid}`,
            reqId,
            nowMs,
            nowMs,
          ],
        });

        // Record sync confirmation for deduplication
        await client.execute({
          sql: `INSERT INTO todo_sync_confirmations (
            confirmation_id, task_id, request_id, ha_entity_id, ha_todo_uid,
            source, sync_direction, payload, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'ha.todo_sync', 'inbound', ?, ?, ?)`,
          args: [
            crypto.randomUUID(),
            taskId,
            reqId,
            entityId,
            uid,
            JSON.stringify({ summary: item.summary, status: item.status, due: item.due }),
            nowMs,
            nowMs,
          ],
        });

        created++;
      }
    }

    logger.log("info", {
      event: "todo.sync.merge_complete", domain: "todo", component: "todo-bridge",
      request_id: SYS_REQ,
      message: `Todo sync: ${created} created, ${updated} updated, ${skipped} skipped from ${items.length} items`,
      metadata: { entity_id: entityId, item_count: items.length, created, updated, skipped },
    });
  } catch (err) {
    logger.log("error", {
      event: "todo.sync.merge_failed", domain: "todo", component: "todo-bridge",
      request_id: SYS_REQ, message: `Failed to merge todo items from ${entityId}: ${err}`,
    });
  }
}

/**
 * Push a Meitheal task TO an HA todo entity.
 */
export async function pushTaskToTodoList(
  taskId: string,
  title: string,
  status: string,
  entityId: string,
  dueDate?: string | null,
  description?: string,
): Promise<boolean> {
  const syncState = activeSyncs.get(entityId);
  if (!syncState || syncState.config.syncDirection === "inbound") {
    return false;
  }

  try {
    const { ensureSchema, getPersistenceClient } = await import("@domains/tasks/persistence/store");
    await ensureSchema();
    const client = getPersistenceClient();

    // Check if this task already has a sync confirmation (outbound already pushed)
    const existing = await client.execute({
      sql: "SELECT ha_todo_uid FROM todo_sync_confirmations WHERE task_id = ? AND ha_entity_id = ?",
      args: [taskId, entityId],
    });

    if (existing.rows.length > 0) {
      // Update existing HA todo item
      const uid = existing.rows[0]!.ha_todo_uid as string;
      const haStatus = meithealStatusToHA(status as "todo" | "in_progress" | "done");
      const dueData = buildDueServiceData(dueDate);

      const success = await updateTodoItem(entityId, uid, {
        summary: title,
        status: haStatus,
        description: description ?? undefined,
        ...dueData,
      });

      if (success) {
        await client.execute({
          sql: "UPDATE todo_sync_confirmations SET payload = ?, updated_at = ? WHERE task_id = ? AND ha_entity_id = ?",
          args: [
            JSON.stringify({ summary: title, status: haStatus }),
            Date.now(),
            taskId,
            entityId,
          ],
        });

        logger.log("info", {
          event: "todo.sync.pushed_to_ha", domain: "todo", component: "todo-bridge",
          request_id: SYS_REQ,
          message: `Updated task "${title}" in HA todo ${entityId}`,
          metadata: { task_id: taskId },
        });
      }

      return success;
    } else {
      // Create new HA todo item
      const success = await addTodoItem(entityId, {
        summary: title,
        due: dueDate ?? undefined,
        description: description ?? undefined,
      });

      if (success) {
        const nowMs = Date.now();
        const outboundUid = `meitheal-${taskId}`;

        await client.execute({
          sql: `INSERT INTO todo_sync_confirmations (
            confirmation_id, task_id, request_id, ha_entity_id, ha_todo_uid,
            source, sync_direction, payload, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'meitheal.todo_push', 'outbound', ?, ?, ?)`,
          args: [
            crypto.randomUUID(),
            taskId,
            crypto.randomUUID(),
            entityId,
            outboundUid,
            JSON.stringify({ summary: title }),
            nowMs,
            nowMs,
          ],
        });

        logger.log("info", {
          event: "todo.sync.pushed_to_ha", domain: "todo", component: "todo-bridge",
          request_id: SYS_REQ,
          message: `Pushed task "${title}" to HA todo ${entityId}`,
          metadata: { task_id: taskId },
        });
      }

      return success;
    }
  } catch (err) {
    logger.log("error", {
      event: "todo.sync.push_failed", domain: "todo", component: "todo-bridge",
      request_id: SYS_REQ, message: `Failed to push task to ${entityId}: ${err}`,
      metadata: { task_id: taskId },
    });
    return false;
  }
}

/**
 * Stop all or specific todo syncs and clean up.
 */
export function stopTodoSync(entityId?: string): void {
  if (entityId) {
    const state = activeSyncs.get(entityId);
    if (state?.unsub) state.unsub();
    activeSyncs.delete(entityId);
  } else {
    for (const [, state] of activeSyncs) {
      if (state.unsub) state.unsub();
    }
    activeSyncs.clear();
  }
}

/**
 * Get current sync status for all or specific todo entities.
 */
export function getTodoSyncStatus(entityId?: string) {
  if (entityId) {
    const state = activeSyncs.get(entityId);
    if (!state) return null;
    return {
      entityId: state.config.entityId,
      active: true,
      direction: state.config.syncDirection,
      writeBack: state.config.writeBack,
      lastSyncAt: state.lastSyncAt,
      itemCount: state.itemCount,
    };
  }

  return Array.from(activeSyncs.entries()).map(([id, state]) => ({
    entityId: id,
    active: true,
    direction: state.config.syncDirection,
    writeBack: state.config.writeBack,
    lastSyncAt: state.lastSyncAt,
    itemCount: state.itemCount,
  }));
}
