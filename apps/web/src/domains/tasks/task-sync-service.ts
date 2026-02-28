import {
  createTaskWithFrameworkAndCalendarSync,
  type CalendarOverride,
  type CreateTaskCommand,
  type CreateTaskPlan,
  type IntegrationOutcome
} from "@meitheal/domain-tasks";
import type { CalendarIntegrationAdapter } from "@meitheal/integration-core";
import {
  ensureSchema,
  findByIdempotencyKey,
  persistCalendarIntegrationResult,
  persistInitialPlan,
  type PersistedTaskResponse
} from "./persistence/store";

export interface CalendarDefaults {
  enabled: boolean;
  entityId: string;
  defaultDurationMinutes: number;
  timezone: string;
}

export interface CreateTaskAndSyncInput {
  title: string;
  frameworkPayload?: Record<string, unknown>;
  requestId: string;
  idempotencyKey: string;
  calendarDefaults: CalendarDefaults;
  calendarOverride?: CalendarOverride;
}

export interface CreateTaskAndSyncResult {
  task: {
    id: string;
    title: string;
    status: string;
    frameworkPayload: Record<string, unknown>;
  };
  events: CreateTaskPlan["events"];
  integration: IntegrationOutcome;
  idempotentReplay: boolean;
}

function mapStoredResponseToResult(stored: PersistedTaskResponse): CreateTaskAndSyncResult {
  return {
    task: {
      id: stored.task.id,
      title: stored.task.title,
      status: stored.task.status,
      frameworkPayload: stored.task.frameworkPayload as Record<string, unknown>
    },
    events: [],
    integration: stored.integration,
    idempotentReplay: true
  };
}

function isIdempotencyConflict(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    /UNIQUE constraint failed:\s*tasks\.idempotency_key/i.test(error.message) ||
    /tasks_idempotency_unique/i.test(error.message)
  );
}

export async function createTaskAndSyncCalendar(
  input: CreateTaskAndSyncInput,
  adapter: CalendarIntegrationAdapter
): Promise<CreateTaskAndSyncResult> {
  await ensureSchema();

  const existing = await findByIdempotencyKey(input.idempotencyKey);
  if (existing) {
    return mapStoredResponseToResult(existing);
  }

  const command: CreateTaskCommand = {
    title: input.title,
    ...(input.frameworkPayload ? { frameworkPayload: input.frameworkPayload } : {}),
    requestId: input.requestId,
    idempotencyKey: input.idempotencyKey,
    calendar: {
      ...input.calendarOverride,
      durationMinutes: input.calendarOverride?.durationMinutes ?? input.calendarDefaults.defaultDurationMinutes,
      timezone: input.calendarOverride?.timezone ?? input.calendarDefaults.timezone
    }
  };
  const plan = createTaskWithFrameworkAndCalendarSync(command);

  try {
    await persistInitialPlan(plan);
  } catch (error) {
    if (isIdempotencyConflict(error)) {
      const recovered = await findByIdempotencyKey(input.idempotencyKey);
      if (recovered) {
        return mapStoredResponseToResult(recovered);
      }
    }
    throw error;
  }

  if (!input.calendarDefaults.enabled) {
    const disabledResult = await persistCalendarIntegrationResult({
      taskId: plan.aggregate.task.id,
      requestId: input.requestId,
      idempotencyKey: input.idempotencyKey,
      result: {
        ok: false,
        errorCode: "service_unavailable",
        retryable: false,
        raw: { reason: "calendar_disabled" }
      }
    });

    return {
      task: {
        id: disabledResult.task.id,
        title: disabledResult.task.title,
        status: disabledResult.task.status,
        frameworkPayload: disabledResult.task.frameworkPayload as Record<string, unknown>
      },
      events: plan.events,
      integration: disabledResult.integration,
      idempotentReplay: false
    };
  }

  const calendarCreateInput = {
    requestId: input.requestId,
    idempotencyKey: input.idempotencyKey,
    entityId: input.calendarOverride?.entityId ?? input.calendarDefaults.entityId,
    summary: plan.calendarRequest.summary,
    startDateTime: plan.calendarRequest.startDateTime,
    endDateTime: plan.calendarRequest.endDateTime,
    ...(plan.calendarRequest.description ? { description: plan.calendarRequest.description } : {})
  };
  const calendarResult = await adapter.createEvent(calendarCreateInput);

  const persisted = await persistCalendarIntegrationResult({
    taskId: plan.aggregate.task.id,
    requestId: input.requestId,
    idempotencyKey: input.idempotencyKey,
    result: calendarResult
  });

  return {
    task: {
      id: persisted.task.id,
      title: persisted.task.title,
      status: persisted.task.status,
      frameworkPayload: persisted.task.frameworkPayload as Record<string, unknown>
    },
    events: plan.events,
    integration: persisted.integration,
    idempotentReplay: false
  };
}
