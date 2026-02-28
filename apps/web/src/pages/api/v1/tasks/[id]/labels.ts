import type { APIRoute } from "astro";
import { json, parsePositiveInt, requireCompatibilityAuth, requestIdFrom } from "@domains/integrations/vikunja-compat/http";
import { attachLabelToTask } from "@domains/integrations/vikunja-compat/store";
import { logCompatRequest, compatTimestamp } from "@domains/integrations/vikunja-compat/compat-logger";

interface AttachLabelPayload {
  label_id?: number | string;
}

export const PUT: APIRoute = async ({ request, params }) => {
  const start = compatTimestamp();
  const requestId = requestIdFrom(request);
  const route = "/api/v1/tasks/:id/labels";

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

  const payload = (await request.json().catch(() => ({}))) as AttachLabelPayload;
  const labelId = parsePositiveInt(payload.label_id?.toString());
  if (!labelId) {
    logCompatRequest({ route, method: "PUT", requestId, status: 400, durationMs: compatTimestamp() - start, error: "missing_label_id" });
    return json({ error: "label_id is required" }, 400);
  }

  const attached = await attachLabelToTask(taskId, labelId);
  if (!attached) {
    logCompatRequest({ route, method: "PUT", requestId, status: 404, durationMs: compatTimestamp() - start, error: "not_found" });
    return json({ error: "Task or label not found" }, 404);
  }

  logCompatRequest({ route, method: "PUT", requestId, status: 201, durationMs: compatTimestamp() - start });
  return json({ task_id: taskId, label_id: labelId, attached: true }, 201);
};
