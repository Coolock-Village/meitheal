import type { APIRoute } from "astro"
import {
  getHabits,
  createHabit,
  completeHabit,
  deleteHabit,
} from "@domains/habits"
import { apiJson, apiError } from "../../lib/api-response"

/**
 * Habits API
 *
 * GET  /api/habits — Get all active habits with stats
 * POST /api/habits — Create habit or complete/delete existing
 *
 * @domain habits
 * @bounded-context habits
 */

export const GET: APIRoute = async () => {
  try {
    const habits = await getHabits()
    return apiJson({ habits })
  } catch {
    return apiError("Failed to get habits")
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const action = String(body.action || "create")

    switch (action) {
      case "create": {
        const name = String(body.name || "").trim()
        if (!name) return apiError("name is required", 400)
        const opts: Parameters<typeof createHabit>[0] = { name }
        if (typeof body.icon === "string") opts.icon = body.icon
        if (typeof body.color === "string") opts.color = body.color
        if (body.frequency === "weekly") opts.frequency = "weekly"
        if (typeof body.targetCount === "number") opts.targetCount = body.targetCount
        const habit = await createHabit(opts)
        return apiJson({ habit })
      }

      case "complete": {
        const habitId = String(body.habitId || "")
        if (!habitId) return apiError("habitId is required", 400)
        const result = await completeHabit(habitId, typeof body.date === "string" ? body.date : undefined)
        return apiJson(result)
      }

      case "delete": {
        const habitId = String(body.habitId || "")
        if (!habitId) return apiError("habitId is required", 400)
        await deleteHabit(habitId)
        return apiJson({ ok: true })
      }

      default:
        return apiError("Invalid action. Use: create, complete, delete", 400)
    }
  } catch {
    return apiError("Failed to manage habit")
  }
}
