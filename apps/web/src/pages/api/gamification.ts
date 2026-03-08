import type { APIRoute } from "astro"
import { getStats, getWeeklyData, recordTaskCompletion, getXpForPriority } from "@domains/gamification"
import { apiJson, apiError } from "../../lib/api-response"

/**
 * Gamification API
 * GET /api/gamification — Get current stats
 * POST /api/gamification — Record a task completion
 */

export const GET: APIRoute = async () => {
  try {
    const [stats, weekly] = await Promise.all([getStats(), getWeeklyData()])
    return apiJson({ stats, weekly, daily_goal: 5 })
  } catch (err) {
    return apiError("Failed to get gamification stats")
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const priority = typeof body.priority === "number" ? body.priority : 3
    const points = getXpForPriority(priority)
    const stats = await recordTaskCompletion(points)
    return apiJson({ stats, confetti: true, xp: points })
  } catch (err) {
    return apiError("Failed to record completion")
  }
}
