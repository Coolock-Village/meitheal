/** Agile work-item hierarchy: epic → story → task */
export type TaskType = "epic" | "story" | "task";

export const VALID_TASK_TYPES: readonly TaskType[] = ["epic", "story", "task"] as const;

/** Valid task status values */
export type TaskStatus =
  | "pending"
  | "todo"
  | "in_progress"
  | "active"
  | "done"
  | "complete"
  | "archived";

export interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  task_type: TaskType;
  frameworkPayload: Record<string, unknown>;
}

/** Full task record as returned by the API */
export interface TaskResponse {
  id: string;
  ticket_number: number | null;
  ticket_key: string | null;
  title: string;
  description: string;
  status: string;
  priority: number;
  due_date: string | null;
  labels: string;
  framework_payload: string;
  calendar_sync_state: string;
  parent_id: string | null;
  time_tracked: number;
  board_id: string;
  custom_fields: string;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  color: string | null;
  is_favorite: number;
  task_type: TaskType;
  created_at: number;
  updated_at: number;
}

/** Paginated task list response */
export interface TaskListResponse {
  tasks: TaskResponse[];
  total: number;
  limit: number;
  offset: number;
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

