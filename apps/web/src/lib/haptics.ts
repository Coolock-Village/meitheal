/**
 * Haptics — Vibration API feedback for mobile
 *
 * Provides tactile feedback patterns for task interactions.
 * Graceful no-op on browsers without Vibration API support.
 *
 * Bounded context: lib (cross-domain utility)
 */

// --- Public API ---

const isSupported = typeof navigator !== "undefined" && "vibrate" in navigator

/** Short success vibration (task completed). */
export function vibrateSuccess(): void {
  if (isSupported) navigator.vibrate([50, 30, 50])
}

/** Warning vibration (WIP limit reached). */
export function vibrateWarning(): void {
  if (isSupported) navigator.vibrate([100, 50, 100, 50, 100])
}

/** Quick tap vibration (UI feedback). */
export function vibrateTap(): void {
  if (isSupported) navigator.vibrate(15)
}

/** Cancel any ongoing vibration. */
export function vibrateCancel(): void {
  if (isSupported) navigator.vibrate(0)
}
