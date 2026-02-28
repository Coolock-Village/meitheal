import type { APIRoute } from "astro";
import { json, parsePositiveInt, requireCompatibilityAuth, requestIdFrom } from "@domains/integrations/vikunja-compat/http";
import { createVikunjaTask, projectExists } from "@domains/integrations/vikunja-compat/store";
import { logCompatRequest, compatTimestamp } from "@domains/integrations/vikunja-compat/compat-logger";

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
  const start = compatTimestamp();
  const requestId = requestIdFrom(request);
  const route = "/api/v1/projects/:id/tasks";

  const authResponse = requireCompatibilityAuth(request);
  if (authResponse) {
    logCompatRequest({ route, method: "PUT", requestId, status: authResponse.status, durationMs: compatTimestamp() - start, error: "auth_failed" });
    return authResponse;
  }

  const projectId = parsePositiveInt(params.id);
  if (!projectId) {
    logCompatRequest({ route, method: "PUT", requestId, status: 400, durationMs: compatTimestamp() - start, error: "invalid_project_id" });
    return json({ error: "Invalid project id" }, 400);
  }
  if (!(await projectExists(projectId))) {
    logCompatRequest({ route, method: "PUT", requestId, status: 404, durationMs: compatTimestamp() - start, error: "project_not_found" });
    return json({ error: "Project not found" }, 404);
  }

  const payload = (await request.json().catch(() => ({}))) as IncomingTaskPayload;
  const title = payload.title?.trim();
  if (!title) {
    logCompatRequest({ route, method: "PUT", requestId, status: 400, durationMs: compatTimestamp() - start, error: "missing_title" });
    return json({ error: "title is required" }, 400);
  }

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

  logCompatRequest({ route, method: "PUT", requestId, status: 201, durationMs: compatTimestamp() - start });
  return json(created, 201);
};

