import type { APIRoute } from "astro";
import { json, requireCompatibilityAuth, requestIdFrom } from "@domains/integrations/vikunja-compat/http";
import { listVikunjaProjects } from "@domains/integrations/vikunja-compat/store";
import { logCompatRequest, compatTimestamp } from "@domains/integrations/vikunja-compat/compat-logger";

export const GET: APIRoute = async ({ request }) => {
  const start = compatTimestamp();
  const requestId = requestIdFrom(request);

  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    logCompatRequest({ route: "/api/v1/projects", method: "GET", requestId, status: authResponse.status, durationMs: compatTimestamp() - start, error: "auth_failed" });
    return authResponse;
  }

  const projects = await listVikunjaProjects();
  logCompatRequest({ route: "/api/v1/projects", method: "GET", requestId, status: 200, durationMs: compatTimestamp() - start });
  return json(projects);
};
