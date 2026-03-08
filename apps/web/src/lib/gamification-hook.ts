/**
 * Gamification client hook — call after task completion to record stats + trigger confetti.
 *
 * @domain gamification
 * @bounded-context gamification
 *
 * @kcs This module provides a client-side function that:
 * 1. POSTs to /api/gamification to record the completion with priority-weighted XP
 * 2. Triggers confetti animation via window.triggerConfetti()
 * 3. Optionally shows a toast notification with streak info
 *
 * XP weights by priority (GAM-06):
 *   P1 (Urgent) = 50 XP
 *   P2 (High)   = 40 XP
 *   P3 (Medium) = 30 XP
 *   P4 (Low)    = 20 XP
 *   P5 (None)   = 10 XP
 *
 * Import this in any page script that handles task completion events.
 */

import { showToast } from "@lib/toast"

/** XP awarded per priority level (1=urgent, 5=none/default) */
const PRIORITY_XP: Record<number, number> = {
  1: 50,
  2: 40,
  3: 30,
  4: 20,
  5: 10,
}

/**
 * Record a task completion and trigger celebration effects.
 * @param priority - Task priority (1-5), defaults to 5 (10 XP)
 */
export async function onTaskCompleted(priority = 5): Promise<void> {
  try {
    const points = PRIORITY_XP[priority] ?? 10

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
