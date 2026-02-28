import { createTask, type Task } from "./index";
import type { DomainEvent } from "@meitheal/integration-core";

export interface CreateTaskCommand {
  title: string;
  frameworkPayload?: Record<string, unknown>;
  requestId: string;
}

export interface CreateTaskResult {
  task: Task;
  events: DomainEvent[];
}

export function createTaskVerticalSlice(command: CreateTaskCommand): CreateTaskResult {
  const task = createTask(command.title, command.frameworkPayload ?? {});

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
        integration: "calendar"
      }
    }
  ];

  return { task, events };
}
