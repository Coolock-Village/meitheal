import type { APIRoute } from "astro";
import { json, requireCompatibilityAuth, requestIdFrom } from "@domains/integrations/vikunja-compat/http";
import { listVikunjaUsers, parseUserQueryPage } from "@domains/integrations/vikunja-compat/store";
import { logCompatRequest, compatTimestamp } from "@domains/integrations/vikunja-compat/compat-logger";

export const GET: APIRoute = async ({ request, url }) => {
  const start = compatTimestamp();
  const requestId = requestIdFrom(request);

  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    logCompatRequest({ route: "/api/v1/users", method: "GET", requestId, status: authResponse.status, durationMs: compatTimestamp() - start, error: "auth_failed" });
    return authResponse;
  }

  const search = url.searchParams.get("s") ?? undefined;
  const page = parseUserQueryPage(url.searchParams.get("page"));
  const users = await listVikunjaUsers(search, page, 50);
  logCompatRequest({ route: "/api/v1/users", method: "GET", requestId, status: 200, durationMs: compatTimestamp() - start });
  return json(users);
};
