import type { APIRoute } from "astro";
import { json, requireCompatibilityAuth } from "@domains/integrations/vikunja-compat/http";
import { createVikunjaLabel, listVikunjaLabels } from "@domains/integrations/vikunja-compat/store";

interface CreateLabelPayload {
  title?: string;
  hex_color?: string;
}

export const GET: APIRoute = async ({ request }) => {
  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    return authResponse;
  }

  const labels = await listVikunjaLabels();
  return json(labels);
};

export const PUT: APIRoute = async ({ request }) => {
  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    return authResponse;
  }

  const payload = (await request.json().catch(() => ({}))) as CreateLabelPayload;
  const title = payload.title?.trim();
  if (!title) {
    return json({ error: "title is required" }, 400);
  }

  const label = await createVikunjaLabel(title, payload.hex_color);
  return json(label, 201);
};
