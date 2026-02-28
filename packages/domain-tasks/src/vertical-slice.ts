import type { CalendarResult, DomainEvent } from "@meitheal/integration-core";
import { createTask, type Task } from "./task";

export type CalendarSyncState = "pending" | "confirmed" | "failed_retryable" | "failed_terminal";

export interface CalendarOverride {
  entityId?: string;
  startDateTime?: string;
  endDateTime?: string;
  durationMinutes?: number;
  timezone?: string;
}

export interface CreateTaskCommand {
  title: string;
  frameworkPayload?: Record<string, unknown>;
  requestId: string;
  idempotencyKey: string;
  calendar?: CalendarOverride;
}

export interface TaskAggregate {
  task: Task;
  requestId: string;
  idempotencyKey: string;
  calendarSyncState: CalendarSyncState;
}

export interface CalendarSyncRequest {
  taskId: string;
  requestId: string;
  idempotencyKey: string;
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timezone?: string;
}

export interface CreateTaskPlan {
  aggregate: TaskAggregate;
  events: DomainEvent[];
  calendarRequest: CalendarSyncRequest;
}

export interface IntegrationOutcome {
  calendarSyncState: CalendarSyncState;
  errorCode?: string;
  retryAfterSeconds?: number;
  confirmationId?: string;
}

function toIsoDateTime(date: Date): string {
  return date.toISOString();
}

function computeCalendarWindow(command: CreateTaskCommand): { startDateTime: string; endDateTime: string } {
  if (command.calendar?.startDateTime && command.calendar?.endDateTime) {
    return {
      startDateTime: command.calendar.startDateTime,
      endDateTime: command.calendar.endDateTime
    };
  }

  const now = new Date();
  const durationMinutes = command.calendar?.durationMinutes ?? 30;
  const end = new Date(now.getTime() + durationMinutes * 60_000);
  return {
    startDateTime: toIsoDateTime(now),
    endDateTime: toIsoDateTime(end)
  };
}

export function createTaskWithFrameworkAndCalendarSync(command: CreateTaskCommand): CreateTaskPlan {
  const task = createTask(command.title, command.frameworkPayload ?? {});
  const window = computeCalendarWindow(command);

  const aggregate: TaskAggregate = {
    task,
    requestId: command.requestId,
    idempotencyKey: command.idempotencyKey,
    calendarSyncState: "pending"
  };

  const events: DomainEvent[] = [
    {
      eventId: crypto.randomUUID(),
      eventType: "task.created",
      occurredAt: new Date().toISOString(),
      requestId: command.requestId,
      payload: {
        taskId: task.id,
        title: task.title,
        frameworkPayload: task.frameworkPayload
      }
    },
    {
      eventId: crypto.randomUUID(),
      eventType: "framework.score.applied",
      occurredAt: new Date().toISOString(),
      requestId: command.requestId,
      payload: {
        taskId: task.id,
        frameworkPayload: task.frameworkPayload
      }
    },
    {
      eventId: crypto.randomUUID(),
      eventType: "integration.sync.requested",
      occurredAt: new Date().toISOString(),
      requestId: command.requestId,
      payload: {
        taskId: task.id,
        integration: "calendar",
        idempotencyKey: command.idempotencyKey
      }
    }
  ];

  return {
    aggregate,
    events,
    calendarRequest: {
      taskId: task.id,
      requestId: command.requestId,
      idempotencyKey: command.idempotencyKey,
      summary: task.title,
      description: `MEITHEAL_TASK_ID=${task.id}\nMEITHEAL_IDEMPOTENCY_KEY=${command.idempotencyKey}`,
      startDateTime: window.startDateTime,
      endDateTime: window.endDateTime,
      ...(command.calendar?.timezone ? { timezone: command.calendar.timezone } : {})
    }
  };
}

export function resolveIntegrationOutcome(result: CalendarResult): IntegrationOutcome {
  if (result.ok) {
    return {
      calendarSyncState: "confirmed",
      confirmationId: result.confirmationId
    };
  }

  return {
    calendarSyncState: result.retryable ? "failed_retryable" : "failed_terminal",
    errorCode: result.errorCode,
    ...(typeof result.retryAfterSeconds === "number"
      ? { retryAfterSeconds: result.retryAfterSeconds }
      : {})
  };
}
