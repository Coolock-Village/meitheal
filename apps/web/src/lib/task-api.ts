/**
 * Task API client — centralized fetch helpers.
 * Domain: Tasks
 */

import { showToast } from "./toast";

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: number;
    due_date?: string;
    labels?: string;
    framework_payload?: string;
    calendar_sync_state?: string;
    board_id?: string;
    custom_fields?: string;
    // Phase 18: Extended fields
    parent_id?: string;
    time_tracked?: number;
    start_date?: string;
    end_date?: string;
    progress?: number;
    color?: string;
    is_favorite?: number;
    task_type?: string;
    created_at: string;
    updated_at: string;
}

/** Fetch all tasks, optionally filtered by board */
export async function fetchTasks(boardId?: string): Promise<Task[]> {
    const url = boardId && boardId !== "all"
        ? `/api/tasks?board_id=${encodeURIComponent(boardId)}`
        : "/api/tasks";
    const res = await fetch(url);
    if (!res.ok) {
        showToast(`Failed to load tasks (${res.status})`, "error");
        return [];
    }
    const data = await res.json();
    return data.tasks ?? [];
}

/** Create a new task */
export async function createTask(
    task: Partial<Task>,
): Promise<Task | null> {
    const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(task),
    });
    if (!res.ok) {
        showToast(`Failed to create task (${res.status})`, "error");
        return null;
    }
    const data = await res.json();
    showToast("Task created", "success");
    return data;
}

/** Update a task by ID */
export async function updateTask(
    id: number | string,
    updates: Partial<Task>,
): Promise<boolean> {
    const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updates),
    });
    if (!res.ok) {
        showToast(`Failed to update task (${res.status})`, "error");
        return false;
    }
    return true;
}

/** Delete a task by ID */
export async function deleteTask(id: number | string): Promise<boolean> {
    const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
    });
    if (!res.ok && res.status !== 204) {
        showToast(`Failed to delete task (${res.status})`, "error");
        return false;
    }
    showToast("Task deleted", "success");
    return true;
}

/** Duplicate a task by ID */
export async function duplicateTask(id: number | string): Promise<Task | null> {
    // Fetch original, then create copy
    const res = await fetch(`/api/tasks/${id}`);
    if (!res.ok) return null;
    const original = await res.json();
    return createTask({
        ...original,
        title: `${original.title} (Copy)`,
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
    });
}
