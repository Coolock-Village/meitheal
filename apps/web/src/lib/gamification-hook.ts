/**
 * Gamification client hook — call after task completion to record stats + trigger confetti.
 *
 * @domain gamification
 * @bounded-context gamification
 *
 * @kcs This module provides a client-side function that:
 * 1. POSTs to /api/gamification with task priority
 * 2. Server computes weighted XP (P1=50, P2=40, P3=30, P4=20, P5=10)
 * 3. Triggers confetti animation via window.triggerConfetti()
 * 4. Shows XP earned and streak milestone toasts
 *
 * Import this in any page script that handles task completion events.
 */

import { showToast } from "@lib/toast"

/**
 * Record a task completion and trigger celebration effects.
 * @param priority - Task priority (1=Critical → 5=Minimal). XP is computed server-side.
 */
export async function onTaskCompleted(priority = 3): Promise<void> {
  try {
    const res = await fetch("/api/gamification", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ priority }),
    })

    if (res.ok) {
      const data = await res.json()

      // Trigger confetti
      if (data.confetti && typeof window.triggerConfetti === "function") {
        window.triggerConfetti()
      }

      // Show XP toast
      if (data.xp) {
        showToast(`+${data.xp} XP`, "success")
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
