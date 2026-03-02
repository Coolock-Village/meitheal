import type { APIRoute } from "astro";
import {
  listVikunjaLabels,
  createVikunjaLabel,
  ensureVikunjaCompatSchema,
} from "@domains/integrations/vikunja-compat/store";
import { stripHtml } from "../../lib/strip-html";
import { apiError, apiJson } from "../../lib/api-response";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["tasks", "audit", "observability"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: true,
});

/**
 * Native Labels API — wraps Vikunja-compat label store.
 * GET /api/labels — list all labels
 * POST /api/labels — create a label { title, hex_color }
 */

export const GET: APIRoute = async () => {
  try {
    await ensureVikunjaCompatSchema();
    const labels = await listVikunjaLabels();
    return apiJson(labels);
  } catch (err) {
    logger.log("error", {
      event: "api.labels.get.failed",
      domain: "tasks",
      component: "labels-api",
      request_id: crypto.randomUUID(),
      message: "Internal server error",
    });
    return apiError("Failed to list labels");
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureVikunjaCompatSchema();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const title = typeof body.title === "string" ? stripHtml(body.title.trim()) : "";

    if (!title) {
      return apiError("title is required", 400);
    }
    if (title.length > 100) {
      return apiError("title must be 100 characters or less", 400);
    }

    const hexColor = typeof body.hex_color === "string" && /^#[0-9a-fA-F]{6}$/.test(body.hex_color)
      ? body.hex_color
      : "#6b7280";

    const label = await createVikunjaLabel(title, hexColor);
    return apiJson(label, 201);
  } catch (err) {
    logger.log("error", {
      event: "api.labels.post.failed",
      domain: "tasks",
      component: "labels-api",
      request_id: crypto.randomUUID(),
      message: "Internal server error",
    });
    return apiError("Failed to create label");
  }
};
