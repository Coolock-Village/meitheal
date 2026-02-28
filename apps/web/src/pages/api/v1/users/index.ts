import type { APIRoute } from "astro";
import { json, requireCompatibilityAuth } from "@domains/integrations/vikunja-compat/http";
import { listVikunjaUsers, parseUserQueryPage } from "@domains/integrations/vikunja-compat/store";

export const GET: APIRoute = async ({ request, url }) => {
  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    return authResponse;
  }

  const search = url.searchParams.get("s") ?? undefined;
  const page = parseUserQueryPage(url.searchParams.get("page"));
  const users = await listVikunjaUsers(search, page, 50);
  return json(users);
};
