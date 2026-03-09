/**
 * Cleanup Corrupt Titles — One-time migration
 *
 * @domain tasks
 * @bounded-context data-integrity
 *
 * Fixes corrupt task titles caused by HA todo sync writing concatenated
 * summary strings like "📋 MTH-82: 📋 MTH-81: ... actual title — DUE — DUE"
 *
 * Called from ha-startup.ts on first connect. Idempotent — skips if already run.
 *
 * @kcs The corruption pattern is:
 * 1. Recursive "📋 MTH-NN: " prefixes (Meitheal notification format leaked into HA todo summary)
 * 2. Trailing "— DUE" repetitions (due date indicator duplicated)
 * 3. The actual title is buried inside the concatenation
 */

import {
  ensureSchema,
  getPersistenceClient,
} from "@domains/tasks/persistence/store"

/**
 * Sanitize a single title string by stripping corruption patterns.
 */
export function sanitizeTodoTitle(summary: string): string {
  // Strip recursive "📋 MTH-NN: " or "🎯 MTH-NN: " or "📖 MTH-NN: " prefixes
  let clean = summary.replace(/^([📋🎯📖✅⚡]\s*MTH-\d+:\s*)+/g, "")
  // Also handle plain "MTH-NN: MTH-NN: " without emoji
  clean = clean.replace(/^(MTH-\d+:\s*)+/g, "")
  // Strip trailing "— DUE" or " — DUE" repetitions
  clean = clean.replace(/(\s*—\s*DUE\s*)+$/gi, "")
  // Strip "Task MTH-NN is due. Open in Meitheal:..." notification text from description leaking into title
  clean = clean.replace(/\s*Task MTH-\d+ is due\.\s*Open in Meitheal:?.*/i, "")
  return clean.trim() || summary
}

/**
 * Run one-time cleanup of corrupt titles in the tasks table.
 * Returns the number of tasks cleaned.
 */
export async function cleanupCorruptTitles(): Promise<number> {
  await ensureSchema()
  const client = getPersistenceClient()

  // Find tasks with corruption patterns in their titles
  const result = await client.execute(
    `SELECT id, title FROM tasks WHERE
      title LIKE '%MTH-%:%MTH-%:%'
      OR title LIKE '%— DUE — DUE%'
      OR title LIKE '%📋 MTH-%'`,
  )

  let cleaned = 0
  for (const row of result.rows) {
    const id = row.id as string
    const oldTitle = row.title as string
    const newTitle = sanitizeTodoTitle(oldTitle)

    if (newTitle !== oldTitle) {
      await client.execute({
        sql: "UPDATE tasks SET title = ?, updated_at = ? WHERE id = ?",
        args: [newTitle, Date.now(), id],
      })
      cleaned++
    }
  }

  return cleaned
}
