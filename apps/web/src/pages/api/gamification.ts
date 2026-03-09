import type { APIRoute } from "astro"
import {
  getStats,
  getWeeklyData,
  recordTaskCompletion,
  getXpForPriority,
  getLevel,
  getProgressToNextLevel,
  getXpToNextLevel,
  checkAchievements,
  getAllAchievements,
  getYearlyHeatmapData,
} from "@domains/gamification"
import { apiJson, apiError } from "../../lib/api-response"

/**
 * Gamification API
 * GET /api/gamification — Get stats, level, achievements, heatmap
 * POST /api/gamification — Record a task completion, check achievements
 */

export const GET: APIRoute = async ({ url }) => {
  try {
    const includeHeatmap = url.searchParams.get("heatmap") === "true"
    const [stats, weekly, achievementData] = await Promise.all([
      getStats(),
      getWeeklyData(),
      getAllAchievements(),
    ])

    const level = getLevel(stats.totalPoints)
    const progressToNext = getProgressToNextLevel(stats.totalPoints)
    const xpToNext = getXpToNextLevel(stats.totalPoints)

    const result: Record<string, unknown> = {
      stats,
      weekly,
      daily_goal: 5,
      level,
      progressToNext,
      xpToNext,
      achievements: achievementData,
    }

    if (includeHeatmap) {
      const year = url.searchParams.get("year")
        ? Number(url.searchParams.get("year"))
        : undefined
      result.heatmap = await getYearlyHeatmapData(year)
    }

    return apiJson(result)
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

    // Check for newly unlocked achievements
    const achievementResult = await checkAchievements(stats)

    const level = getLevel(stats.totalPoints)
    const progressToNext = getProgressToNextLevel(stats.totalPoints)

    return apiJson({
      stats,
      confetti: true,
      xp: points,
      level,
      progressToNext,
      newAchievements: achievementResult.newlyUnlocked,
    })
  } catch (err) {
    return apiError("Failed to record completion")
  }
}

