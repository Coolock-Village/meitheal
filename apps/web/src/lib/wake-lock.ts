/**
 * Screen Wake Lock — Keep screen on during task focus
 *
 * Uses the Screen Wake Lock API to prevent the screen from dimming
 * while the user is active in a focus/timer view.
 * Releases automatically on page visibility change.
 *
 * Bounded context: lib (cross-domain utility)
 */

let wakeLock: WakeLockSentinel | null = null

/**
 * Request a screen wake lock. Prevents screen dimming during focus.
 * Returns true if lock acquired, false if API unavailable or denied.
 */
export async function requestWakeLock(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
    return false
  }

  try {
    wakeLock = await navigator.wakeLock.request("screen")
    wakeLock.addEventListener("release", () => {
      wakeLock = null
    })
    return true
  } catch {
    return false
  }
}

/**
 * Release the active wake lock.
 */
export async function releaseWakeLock(): Promise<void> {
  if (wakeLock) {
    await wakeLock.release()
    wakeLock = null
  }
}

/**
 * Check if wake lock is currently active.
 */
export function isWakeLockActive(): boolean {
  return wakeLock !== null && !wakeLock.released
}

/**
 * Auto-reacquire wake lock when page becomes visible again.
 * Call once during app initialization.
 */
export function enableWakeLockPersistence(): void {
  if (typeof document === "undefined") return

  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && wakeLock === null) {
      if (localStorage.getItem("meitheal_focus_mode") === "1") {
        await requestWakeLock()
      }
    }
  })
}
