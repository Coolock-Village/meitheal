/**
 * Web Share API — Native sharing for tasks
 *
 * Uses navigator.share() for native OS share dialog on supported platforms.
 * Falls back to clipboard copy on unsupported browsers.
 *
 * Bounded context: lib (cross-domain utility)
 */

import { copyToClipboard } from "./clipboard"

// --- Public API ---

interface ShareableTask {
  id: string
  title: string
  description?: string
}

/**
 * Share a task using the native Web Share API.
 * Falls back to clipboard copy if Web Share is unavailable.
 * Returns true if shared/copied, false otherwise.
 */
export async function shareTask(task: ShareableTask): Promise<boolean> {
  const url = `${window.location.origin}/tasks?open=${task.id}`
  const text = task.description
    ? `${task.title}\n\n${task.description}`
    : task.title

  // Try native share first
  if (isShareSupported()) {
    try {
      await navigator.share({
        title: task.title,
        text,
        url,
      })
      return true
    } catch (e) {
      // User cancelled or share failed — fall through to clipboard
      if (e instanceof Error && e.name === "AbortError") return false
    }
  }

  // Fallback: copy to clipboard
  return copyToClipboard(`${task.title}\n${url}`)
}

/**
 * Check if Web Share API is available.
 */
export function isShareSupported(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator
}
