import type { APIRoute } from "astro";
import { saveCalendarConfirmation } from "@domains/integrations/calendar-memory-store";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["integrations", "audit"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: true
});

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as { taskId?: string };
  if (!body.taskId) {
    return new Response(JSON.stringify({ error: "taskId is required" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const confirmation = saveCalendarConfirmation(body.taskId);
  const requestId = crypto.randomUUID();

  logger.log("info", {
    event: "calendar.confirmation.received",
    domain: "integrations",
    component: "calendar-api",
    request_id: requestId,
    task_id: body.taskId,
    integration: "calendar",
    message: "Calendar confirmation received"
  });

  logger.audit({
    event: "audit.integration.calendar",
    domain: "audit",
    component: "calendar-api",
    request_id: requestId,
    task_id: body.taskId,
    integration: "calendar",
    message: "Calendar confirmation persisted"
  });

  return new Response(JSON.stringify({ confirmation }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
