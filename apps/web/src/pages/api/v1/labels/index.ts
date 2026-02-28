import type { APIRoute } from "astro";
import { json, requireCompatibilityAuth, requestIdFrom } from "@domains/integrations/vikunja-compat/http";
import { createVikunjaLabel, listVikunjaLabels } from "@domains/integrations/vikunja-compat/store";
import { logCompatRequest, compatTimestamp } from "@domains/integrations/vikunja-compat/compat-logger";

interface CreateLabelPayload {
  title?: string;
  hex_color?: string;
}

export const GET: APIRoute = async ({ request }) => {
  const start = compatTimestamp();
  const requestId = requestIdFrom(request);

  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    logCompatRequest({ route: "/api/v1/labels", method: "GET", requestId, status: authResponse.status, durationMs: compatTimestamp() - start, error: "auth_failed" });
    return authResponse;
  }

  const labels = await listVikunjaLabels();
  logCompatRequest({ route: "/api/v1/labels", method: "GET", requestId, status: 200, durationMs: compatTimestamp() - start });
  return json(labels);
};

export const PUT: APIRoute = async ({ request }) => {
  const start = compatTimestamp();
  const requestId = requestIdFrom(request);

  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    logCompatRequest({ route: "/api/v1/labels", method: "PUT", requestId, status: authResponse.status, durationMs: compatTimestamp() - start, error: "auth_failed" });
    return authResponse;
  }

  const payload = (await request.json().catch(() => ({}))) as CreateLabelPayload;
  const title = payload.title?.trim();
  if (!title) {
    logCompatRequest({ route: "/api/v1/labels", method: "PUT", requestId, status: 400, durationMs: compatTimestamp() - start, error: "missing_title" });
    return json({ error: "title is required" }, 400);
  }

  const label = await createVikunjaLabel(title, payload.hex_color);
  logCompatRequest({ route: "/api/v1/labels", method: "PUT", requestId, status: 201, durationMs: compatTimestamp() - start });
  return json(label, 201);
};
