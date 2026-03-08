/**
 * Label Store — DDD bounded context for label management.
 * Wraps Vikunja compat label storage and provides unified label API.
 *
 * @kcs Labels are stored in two places:
 * 1. `tasks.labels` — JSON string array of label names (native)
 * 2. `vikunja_labels` — Relational table with id/title/hex_color (compat)
 * This store bridges both by using vikunja_labels for color lookup
 * and tasks.labels for task-level association.
 */

import {
  listVikunjaLabels,
  createVikunjaLabel,
  ensureVikunjaCompatSchema,
} from "@domains/integrations/vikunja-compat/store"
import { getPersistenceClient } from "@domains/tasks/persistence/store"
import { stripHtml } from "../../lib/strip-html"

export interface Label {
  id: number
  title: string
  hexColor: string
}

/**
 * List all labels from the label store.
 * Returns labels with id, title, and hex color.
 */
export async function listLabels(): Promise<Label[]> {
  await ensureVikunjaCompatSchema()
  const labels = await listVikunjaLabels()
  return labels.map((l) => ({
    id: l.id,
    title: l.title,
    hexColor: l.hex_color.startsWith("#") ? l.hex_color : `#${l.hex_color}`,
  }))
}

/**
 * Create a label. Returns existing if title matches (case-insensitive).
 * Title is sanitized and length-capped at 100 characters.
 */
export async function createLabel(
  title: string,
  hexColor?: string
): Promise<Label> {
  const sanitized = stripHtml(title.trim()).slice(0, 100)
  if (!sanitized) {
    throw new Error("Label title is required")
  }

  const color =
    hexColor && /^#?[0-9a-fA-F]{6}$/.test(hexColor)
      ? hexColor.replace(/^#/, "")
      : "6b7280"

  const label = await createVikunjaLabel(sanitized, color)
  return {
    id: label.id,
    title: label.title,
    hexColor: label.hex_color.startsWith("#")
      ? label.hex_color
      : `#${label.hex_color}`,
  }
}

/**
 * Update a label's title and/or color.
 * Title is sanitized and length-capped at 100 characters.
 */
export async function updateLabel(
  id: number,
  updates: { title?: string; hexColor?: string }
): Promise<Label | null> {
  await ensureVikunjaCompatSchema()
  const client = getPersistenceClient()

  const existing = await client.execute({
    sql: "SELECT id, title, hex_color FROM vikunja_labels WHERE id = ? LIMIT 1",
    args: [id],
  })

  if (existing.rows.length === 0) return null

  const row = existing.rows[0] as Record<string, unknown>
  const newTitle = updates.title
    ? stripHtml(updates.title.trim()).slice(0, 100)
    : String(row.title)
  const newColor = updates.hexColor
    ? updates.hexColor.replace(/^#/, "")
    : String(row.hex_color)

  if (!newTitle) return null

  await client.execute({
    sql: "UPDATE vikunja_labels SET title = ?, hex_color = ? WHERE id = ?",
    args: [newTitle, newColor, id],
  })

  return {
    id: Number(row.id),
    title: newTitle,
    hexColor: newColor.startsWith("#") ? newColor : `#${newColor}`,
  }
}

/**
 * Delete a label by ID.
 * Also removes it from the vikunja_task_labels junction table.
 * Returns true if label existed and was deleted.
 */
export async function deleteLabel(id: number): Promise<boolean> {
  await ensureVikunjaCompatSchema()
  const client = getPersistenceClient()

  const existing = await client.execute({
    sql: "SELECT id, title FROM vikunja_labels WHERE id = ? LIMIT 1",
    args: [id],
  })

  if (existing.rows.length === 0) return false

  // Remove from junction table
  await client.execute({
    sql: "DELETE FROM vikunja_task_labels WHERE label_id = ?",
    args: [id],
  })

  // Remove the label itself
  await client.execute({
    sql: "DELETE FROM vikunja_labels WHERE id = ?",
    args: [id],
  })

  return true
}

/**
 * Get the label color map: label title (lowercase) → hex color.
 * Used by label-color-resolver for rendering.
 */
export async function getLabelColorMap(): Promise<Map<string, string>> {
  const labels = await listLabels()
  const map = new Map<string, string>()
  for (const label of labels) {
    map.set(label.title.toLowerCase(), label.hexColor)
  }
  return map
}
