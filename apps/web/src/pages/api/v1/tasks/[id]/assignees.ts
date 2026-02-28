import type { APIRoute } from "astro";
import { json, parsePositiveInt, requireCompatibilityAuth, requestIdFrom } from "@domains/integrations/vikunja-compat/http";
import { assignUserToTask } from "@domains/integrations/vikunja-compat/store";
import { logCompatRequest, compatTimestamp } from "@domains/integrations/vikunja-compat/compat-logger";

interface AssignPayload {
  user_id?: number | string;
}

export const PUT: APIRoute = async ({ request, params }) => {
  const start = compatTimestamp();
  const requestId = requestIdFrom(request);
  const route = "/api/v1/tasks/:id/assignees";

  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    logCompatRequest({ route, method: "PUT", requestId, status: authResponse.status, durationMs: compatTimestamp() - start, error: "auth_failed" });
    return authResponse;
  }

  const taskId = params.id;
  if (!taskId) {
    logCompatRequest({ route, method: "PUT", requestId, status: 400, durationMs: compatTimestamp() - start, error: "invalid_task_id" });
    return json({ error: "Invalid task id" }, 400);
  }

  const payload = (await request.json().catch(() => ({}))) as AssignPayload;
  const userId = parsePositiveInt(payload.user_id?.toString());
  if (!userId) {
    logCompatRequest({ route, method: "PUT", requestId, status: 400, durationMs: compatTimestamp() - start, error: "missing_user_id" });
    return json({ error: "user_id is required" }, 400);
  }

  const assigned = await assignUserToTask(taskId, userId);
  if (!assigned) {
    logCompatRequest({ route, method: "PUT", requestId, status: 404, durationMs: compatTimestamp() - start, error: "not_found" });
    return json({ error: "Task or user not found" }, 404);
  }

  logCompatRequest({ route, method: "PUT", requestId, status: 201, durationMs: compatTimestamp() - start });
  return json({ task_id: taskId, user_id: userId, assigned: true }, 201);
};
