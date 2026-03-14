import type { APIRoute } from "astro"
import { parseTaskInput } from "../../lib/nl-task-parser"
import { apiJson, apiError } from "../../lib/api-response"
import { isFeatureEnabled } from "../../lib/feature-flags"

/**
 * NLP Parse API — preview parse results for live task creation preview
 *
 * POST /api/parse-task
 * Body: { text: "Buy groceries tomorrow !!" }
 * Returns: { title, dueDate, priority, labels, assignee, hasExtractions }
 *
 * @domain tasks
 * @bounded-context tasks
 */

export const POST: APIRoute = async ({ request }) => {
  if (!(await isFeatureEnabled("nlp_parser"))) {
    return apiError("Smart task parsing is disabled in settings", 404)
  }
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const text = String(body.text || "")

    if (!text.trim()) {
      return apiError("text is required", 400)
    }

    const parsed = parseTaskInput(text)
    return apiJson(parsed)
  } catch {
    return apiError("Failed to parse task input")
  }
}
