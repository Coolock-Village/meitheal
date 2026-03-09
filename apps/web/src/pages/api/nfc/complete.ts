import type { APIRoute } from "astro"
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store"
import { TaskRepository } from "@domains/tasks/persistence/task-repository"
import { apiJson, apiError } from "../../../lib/api-response"
import { isDoneStatus, STATUS } from "../../../lib/status-config"

/**
 * NFC Tag Task Completion API
 *
 * POST /api/nfc/complete
 * Body: { tag_id: "nfc-abc123" }
 *
 * Finds a task with the matching nfc_tag_id and marks it complete.
 * Used by HA automations triggered by NFC tag scans.
 *
 * GET /api/nfc/lookup?tag_id=nfc-abc123
 * Returns the task linked to the NFC tag.
 *
 * @domain tasks
 * @bounded-context tasks
 *
 * @kcs NFC tag IDs are stored per-task in the nfc_tag_id column.
 * A single tag maps to a single task. Scanning completes the task
 * (or creates the next recurrence if it's a recurring task).
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureSchema()
    const client = getPersistenceClient()
    const repo = new TaskRepository(client)
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const tagId = String(body.tag_id || "").trim()

    if (!tagId) {
      return apiError("tag_id is required", 400)
    }

    // Find task by NFC tag ID
    const result = await client.execute({
      sql: "SELECT id, status FROM tasks WHERE nfc_tag_id = ? LIMIT 1",
      args: [tagId],
    })

    if (result.rows.length === 0) {
      return apiError("No task linked to this NFC tag", 404)
    }

    const task = result.rows[0] as Record<string, unknown>
    const taskId = String(task.id)
    const currentStatus = String(task.status)

    // Already complete
    if (isDoneStatus(currentStatus)) {
      return apiJson({ ok: true, already_complete: true, task_id: taskId })
    }

    // Mark as complete
    await repo.updateTask(taskId, { status: STATUS.COMPLETE })

    return apiJson({
      ok: true,
      task_id: taskId,
      completed: true,
    })
  } catch {
    return apiError("Failed to complete task by NFC tag")
  }
}

export const GET: APIRoute = async ({ url }) => {
  try {
    await ensureSchema()
    const client = getPersistenceClient()
    const tagId = url.searchParams.get("tag_id") || ""

    if (!tagId) {
      return apiError("tag_id query parameter is required", 400)
    }

    const result = await client.execute({
      sql: "SELECT id, title, status, priority, due_date FROM tasks WHERE nfc_tag_id = ? LIMIT 1",
      args: [tagId],
    })

    if (result.rows.length === 0) {
      return apiError("No task linked to this NFC tag", 404)
    }

    return apiJson({ task: result.rows[0] })
  } catch {
    return apiError("Failed to look up NFC tag")
  }
}
