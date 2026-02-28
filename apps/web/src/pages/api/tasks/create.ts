import type { APIRoute } from "astro";
import { createTaskVerticalSlice } from "@meitheal/domain-tasks";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["tasks", "integrations", "audit"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: true
});

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    frameworkPayload?: Record<string, unknown>;
  };

  if (!body.title?.trim()) {
    return new Response(JSON.stringify({ error: "title is required" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const requestId = crypto.randomUUID();
  const result = createTaskVerticalSlice(
    body.frameworkPayload
      ? {
          title: body.title,
          frameworkPayload: body.frameworkPayload,
          requestId
        }
      : {
          title: body.title,
          requestId
        }
  );

  logger.log("info", {
    event: "task.created",
    domain: "tasks",
    component: "tasks-api",
    request_id: requestId,
    task_id: result.task.id,
    message: "Task created and integration sync requested"
  });

  logger.audit({
    event: "audit.task.lifecycle",
    domain: "audit",
    component: "tasks-api",
    request_id: requestId,
    task_id: result.task.id,
    message: "Recorded task creation lifecycle event"
  });

  return new Response(
    JSON.stringify({
      task: result.task,
      events: result.events
    }),
    {
      status: 201,
      headers: { "content-type": "application/json" }
    }
  );
};
