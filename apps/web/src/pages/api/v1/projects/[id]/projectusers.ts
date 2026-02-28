import type { APIRoute } from "astro";
import { json, parsePositiveInt, requireCompatibilityAuth } from "@domains/integrations/vikunja-compat/http";
import { listVikunjaProjectUsers, projectExists } from "@domains/integrations/vikunja-compat/store";

export const GET: APIRoute = async ({ request, params }) => {
  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    return authResponse;
  }

  const projectId = parsePositiveInt(params.id);
  if (!projectId) {
    return json({ error: "Invalid project id" }, 400);
  }

  if (!(await projectExists(projectId))) {
    return json({ error: "Project not found" }, 404);
  }

  const users = await listVikunjaProjectUsers(projectId);
  return json(users);
};
