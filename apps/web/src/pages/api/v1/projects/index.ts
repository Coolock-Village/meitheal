import type { APIRoute } from "astro";
import { json, requireCompatibilityAuth } from "@domains/integrations/vikunja-compat/http";
import { listVikunjaProjects } from "@domains/integrations/vikunja-compat/store";

export const GET: APIRoute = async ({ request }) => {
  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    return authResponse;
  }

  const projects = await listVikunjaProjects();
  return json(projects);
};
