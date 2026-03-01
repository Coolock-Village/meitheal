/**
 * Clipboard API — Copy task data to clipboard
 *
 * Uses the modern Clipboard API (navigator.clipboard.writeText).
 * Includes formatted markdown copy for rich task details.
 *
 * Bounded context: lib (cross-domain utility)
 */

// --- Public API ---

/**
 * Copy text to clipboard. Returns true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern Clipboard API
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Falls through to execCommand fallback
    }
  }

  // Legacy fallback
  return execCommandCopy(text)
}

/**
 * Copy a task's URL to clipboard.
 */
export async function copyTaskUrl(taskId: string): Promise<boolean> {
  const url = `${window.location.origin}/tasks?open=${taskId}`
  return copyToClipboard(url)
}

/**
 * Copy a task as formatted markdown.
 */
export async function copyTaskAsMarkdown(task: {
  title: string
  description?: string
  status?: string
  priority?: number
  dueDate?: string
}): Promise<boolean> {
  const lines: string[] = [
    `## ${task.title}`,
    "",
  ]

  if (task.status) lines.push(`**Status:** ${task.status}`)
  if (task.priority) lines.push(`**Priority:** ${task.priority}`)
  if (task.dueDate) lines.push(`**Due:** ${task.dueDate}`)
  if (task.description) {
    lines.push("")
    lines.push(task.description)
  }

  return copyToClipboard(lines.join("\n"))
}

// --- Fallback ---

function execCommandCopy(text: string): boolean {
  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand("copy")
    document.body.removeChild(textarea)
    return success
  } catch {
    return false
  }
}
