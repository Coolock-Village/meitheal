import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";
import {
  HomeAssistantCalendarAdapter,
  type CalendarIntegrationAdapter,
  resolveHomeAssistantAuthFromEnv
} from "@meitheal/integration-core";
import { createTaskAndSyncCalendar, type CalendarDefaults } from "@domains/tasks/task-sync-service";
import { sanitize } from "../../../lib/sanitize";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["tasks", "integrations", "audit", "observability"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: true
});

function fallbackCalendarDefaults(): CalendarDefaults {
  return {
    enabled: true,
    entityId: "calendar.home",
    defaultDurationMinutes: 30,
    timezone: "UTC"
  };
}

async function loadCalendarDefaults(): Promise<CalendarDefaults> {
  try {
    const configs = await getCollection("config");
    const integrationsEntry = configs.find((entry: (typeof configs)[number]) => entry.id === "integrations");
    const calendar = integrationsEntry?.data.integrations?.calendar;

    if (!calendar) {
      return fallbackCalendarDefaults();
    }

    return {
      enabled: calendar.enabled,
      entityId: calendar.entity_id,
      defaultDurationMinutes: calendar.default_duration_minutes,
      timezone: calendar.timezone
    };
  } catch (error) {
    logger.log("warn", {
      event: "config.calendar.defaults.fallback",
      domain: "observability",
      component: "tasks-api",
      request_id: crypto.randomUUID(),
      message: `Falling back to calendar defaults: ${error instanceof Error ? error.message : "unknown error"}`
    });
    return fallbackCalendarDefaults();
  }
}

function createCalendarAdapter(): CalendarIntegrationAdapter {
  try {
    const auth = resolveHomeAssistantAuthFromEnv();
    return new HomeAssistantCalendarAdapter({
      baseUrl: auth.baseUrl,
      token: auth.token,
      timeoutMs: 8_000
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Missing HA credentials";

    // Return a deterministic adapter fallback so persistence and audit trails still run.
    return {
      async createEvent() {
        return {
          ok: false,
          errorCode: "service_unavailable",
          retryable: false,
          raw: { message }
        };
      }
    };
  }
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    frameworkPayload?: Record<string, unknown>;
    calendar?: {
      entityId?: string;
      startDateTime?: string;
      endDateTime?: string;
      durationMinutes?: number;
      timezone?: string;
    };
  };

  const rawTitle = typeof body.title === "string" ? body.title : "";
  const title = sanitize(rawTitle).trim();

  if (!title) {
    return new Response(JSON.stringify({ error: "title is required" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const idempotencyKey = request.headers.get("idempotency-key") ?? crypto.randomUUID();

  const calendarDefaults = await loadCalendarDefaults();
  const adapter = createCalendarAdapter();

  const result = await createTaskAndSyncCalendar(
    {
      title,
      ...(body.frameworkPayload ? { frameworkPayload: body.frameworkPayload } : {}),
      requestId,
      idempotencyKey,
      calendarDefaults,
      ...(body.calendar ? { calendarOverride: body.calendar } : {})
    },
    adapter
  );

  logger.log("info", {
    event: "task.create.completed",
    domain: "tasks",
    component: "tasks-api",
    request_id: requestId,
    task_id: result.task.id,
    integration: "calendar",
    message: "Task create request completed"
  });

  if (result.integration.calendarSyncState !== "confirmed") {
    logger.log("warn", {
      event: "integration.calendar.sync.failed",
      domain: "integrations",
      component: "tasks-api",
      request_id: requestId,
      task_id: result.task.id,
      integration: "calendar",
      ...(result.integration.errorCode ? { err_code: result.integration.errorCode } : {}),
      message: "Calendar integration did not confirm"
    });
  }

  logger.audit({
    event: "audit.task.lifecycle",
    domain: "audit",
    component: "tasks-api",
    request_id: requestId,
    task_id: result.task.id,
    integration: "calendar",
    message: result.idempotentReplay
      ? "Returned persisted idempotent response"
      : "Created task and processed calendar sync"
  });

  return new Response(
    JSON.stringify({
      task: result.task,
      events: result.events,
      integration: {
        calendarSyncState: result.integration.calendarSyncState,
        confirmationId: result.integration.confirmationId,
        errorCode: result.integration.errorCode,
        retryAfterSeconds: result.integration.retryAfterSeconds
      },
      requestId,
      idempotencyKey,
      idempotentReplay: result.idempotentReplay
    }),
    {
      status: result.idempotentReplay ? 200 : 201,
      headers: { "content-type": "application/json" }
    }
  );
};
