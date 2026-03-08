/**
 * Gamification client hook — call after task completion to record stats + trigger confetti.
 *
 * @domain gamification
 * @bounded-context gamification
 *
 * @kcs This module provides a client-side function that:
 * 1. POSTs to /api/gamification to record the completion
 * 2. Triggers confetti animation via window.triggerConfetti()
 * 3. Optionally shows a toast notification with streak info
 *
 * Import this in any page script that handles task completion events.
 */

import { showToast } from "@lib/toast"

/**
 * Record a task completion and trigger celebration effects.
 * @param points - Optional XP points (default: 10)
 */
export async function onTaskCompleted(points = 10): Promise<void> {
  try {
    const res = await fetch("/api/gamification", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ points }),
    })

    if (res.ok) {
      const data = await res.json()

      // Trigger confetti
      if (data.confetti && typeof (window as any).triggerConfetti === "function") {
        ;(window as any).triggerConfetti()
      }

      // Show streak toast for milestones
      const streak = data.stats?.currentStreak ?? 0
      if (streak > 0 && streak % 5 === 0) {
        showToast(`🔥 ${streak} day streak!`, "success")
      }
    }
  } catch {
    // Non-critical — don't block the completion flow
  }
}
