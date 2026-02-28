import type { APIRoute } from "astro";
import { json, parsePositiveInt, requireCompatibilityAuth } from "@domains/integrations/vikunja-compat/http";
import { attachLabelToTask } from "@domains/integrations/vikunja-compat/store";

interface AttachLabelPayload {
  label_id?: number | string;
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

  const payload = (await request.json().catch(() => ({}))) as AttachLabelPayload;
  const labelId = parsePositiveInt(payload.label_id?.toString());
  if (!labelId) {
    return json({ error: "label_id is required" }, 400);
  }

  const attached = await attachLabelToTask(taskId, labelId);
  if (!attached) {
    return json({ error: "Task or label not found" }, 404);
  }

  return json({ task_id: taskId, label_id: labelId, attached: true }, 201);
};
