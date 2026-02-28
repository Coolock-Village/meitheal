import type { APIRoute } from "astro";
import { json, parsePositiveInt, requireCompatibilityAuth, requestIdFrom } from "@domains/integrations/vikunja-compat/http";
import { listVikunjaProjectUsers, projectExists } from "@domains/integrations/vikunja-compat/store";
import { logCompatRequest, compatTimestamp } from "@domains/integrations/vikunja-compat/compat-logger";

export const GET: APIRoute = async ({ request, params }) => {
  const start = compatTimestamp();
  const requestId = requestIdFrom(request);

  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    logCompatRequest({ route: "/api/v1/projects/:id/projectusers", method: "GET", requestId, status: authResponse.status, durationMs: compatTimestamp() - start, error: "auth_failed" });
    return authResponse;
  }

  const projectId = parsePositiveInt(params.id);
  if (!projectId) {
    logCompatRequest({ route: "/api/v1/projects/:id/projectusers", method: "GET", requestId, status: 400, durationMs: compatTimestamp() - start, error: "invalid_project_id" });
    return json({ error: "Invalid project id" }, 400);
  }

  if (!(await projectExists(projectId))) {
    logCompatRequest({ route: "/api/v1/projects/:id/projectusers", method: "GET", requestId, status: 404, durationMs: compatTimestamp() - start, error: "project_not_found" });
    return json({ error: "Project not found" }, 404);
  }

  const users = await listVikunjaProjectUsers(projectId);
  logCompatRequest({ route: "/api/v1/projects/:id/projectusers", method: "GET", requestId, status: 200, durationMs: compatTimestamp() - start });
  return json(users);
};
