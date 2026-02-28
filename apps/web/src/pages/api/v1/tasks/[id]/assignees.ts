import type { APIRoute } from "astro";
import { json, parsePositiveInt, requireCompatibilityAuth } from "@domains/integrations/vikunja-compat/http";
import { assignUserToTask } from "@domains/integrations/vikunja-compat/store";

interface AssignPayload {
  user_id?: number | string;
}

export const PUT: APIRoute = async ({ request, params }) => {
  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    return authResponse;
  }

  const taskId = params.id;
  if (!taskId) {
    return json({ error: "Invalid task id" }, 400);
  }

  const payload = (await request.json().catch(() => ({}))) as AssignPayload;
  const userId = parsePositiveInt(payload.user_id?.toString());
  if (!userId) {
    return json({ error: "user_id is required" }, 400);
  }

  const assigned = await assignUserToTask(taskId, userId);
  if (!assigned) {
    return json({ error: "Task or user not found" }, 404);
  }

  return json({ task_id: taskId, user_id: userId, assigned: true }, 201);
};
