import type { APIRoute } from "astro";
import {
  listVikunjaLabels,
  createVikunjaLabel,
  ensureVikunjaCompatSchema,
} from "@domains/integrations/vikunja-compat/store";
import { stripHtml } from "../../lib/strip-html";

/**
 * Native Labels API — wraps Vikunja-compat label store.
 * GET /api/labels — list all labels
 * POST /api/labels — create a label { title, hex_color }
 */

export const GET: APIRoute = async () => {
  await ensureVikunjaCompatSchema();
  const labels = await listVikunjaLabels();
  return new Response(JSON.stringify(labels), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  await ensureVikunjaCompatSchema();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = typeof body.title === "string" ? stripHtml(body.title.trim()) : "";

  if (!title) {
    return new Response(JSON.stringify({ error: "title is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (title.length > 100) {
    return new Response(JSON.stringify({ error: "title must be 100 characters or less" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const hexColor = typeof body.hex_color === "string" && /^#[0-9a-fA-F]{6}$/.test(body.hex_color)
    ? body.hex_color
    : "#6b7280";

  const label = await createVikunjaLabel(title, hexColor);
  return new Response(JSON.stringify(label), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};
