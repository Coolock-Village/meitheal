export interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  frameworkPayload: Record<string, unknown>;
}

export function createTask(title: string, frameworkPayload: Record<string, unknown> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title,
    status: "todo",
    frameworkPayload
  };
}
