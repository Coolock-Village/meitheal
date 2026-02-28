import type { APIRoute } from "astro";
import { json, parsePositiveInt, requireCompatibilityAuth, requestIdFrom } from "@domains/integrations/vikunja-compat/http";
import { createVikunjaTask, projectExists } from "@domains/integrations/vikunja-compat/store";

interface IncomingTaskPayload {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: number;
  repeat_after?: number;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

export const PUT: APIRoute = async ({ request, params }) => {
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

  const payload = (await request.json().catch(() => ({}))) as IncomingTaskPayload;
  const title = payload.title?.trim();
  if (!title) {
    return json({ error: "title is required" }, 400);
  }

  const requestId = requestIdFrom(request);
  const idempotencyKey = request.headers.get("idempotency-key") ?? `compat:${requestId}`;
  const priority = parseNumber(payload.priority);
  const repeatAfter = parseNumber(payload.repeat_after);

  const created = await createVikunjaTask({
    projectId,
    title,
    ...(typeof payload.description === "string" ? { description: payload.description } : {}),
    ...(typeof payload.due_date === "string" ? { dueDate: payload.due_date } : {}),
    ...(typeof priority === "number" ? { priority } : {}),
    ...(typeof repeatAfter === "number" ? { repeatAfter } : {}),
    requestId,
    idempotencyKey
  });

  return json(created, 201);
};
