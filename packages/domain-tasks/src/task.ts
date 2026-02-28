/** Agile work-item hierarchy: epic → story → task */
export type TaskType = "epic" | "story" | "task";

export const VALID_TASK_TYPES: readonly TaskType[] = ["epic", "story", "task"] as const;

export interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  task_type: TaskType;
  frameworkPayload: Record<string, unknown>;
}

export function createTask(
  title: string,
  frameworkPayload: Record<string, unknown> = {},
  task_type: TaskType = "task",
): Task {
  return {
    id: crypto.randomUUID(),
    title,
    status: "todo",
    task_type,
    frameworkPayload,
  };
}
