/**
 * TaskApiClient — typed client-side API wrapper for task operations.
 * @domain Task Management (client-side)
 *
 * Centralizes all client-side fetch() calls that hit /api/tasks/*.
 * Wraps safeFetch for timeout + flood protection.
 * Handles ingress path prefixing automatically.
 *
 * Usage (in <script> blocks or client-side TS):
 *   import { taskApi } from '@lib/task-api-client';
 *   await taskApi.updateTask(id, { status: 'complete' });
 *   const tasks = await taskApi.listTasks();
 *
 * @see safe-fetch.ts for the underlying fetch wrapper
 */

import { safeFetch, type SafeFetchOptions } from "./safe-fetch";

// ── Types ──────────────────────────────────────────────────────────────────

/** Fields accepted by PATCH /api/tasks/:id */
export interface TaskPatchPayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: number;
  due_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  labels?: string;
  board_id?: string;
  color?: string | null;
  is_favorite?: number;
  task_type?: string;
  parent_id?: string | null;
  assigned_to?: string | null;
  kanban_position?: number | null;
  progress?: number;
  custom_fields?: string;
  framework_payload?: string;
  [key: string]: unknown;
}

/** Fields for POST /api/tasks */
export interface TaskCreatePayload {
  title: string;
  description?: string;
  status?: string;
  priority?: number;
  due_date?: string | null;
  board_id?: string;
  task_type?: string;
  assigned_to?: string | null;
  [key: string]: unknown;
}

/** Reorder payload for POST /api/tasks/reorder */
export interface ReorderPayload {
  taskId: string;
  status: string;
  position: number;
}

/** Lane definition from GET /api/lanes */
export interface LanePayload {
  id: string;
  key: string;
  label: string;
  icon: string;
  position: number;
  wip_limit: number;
  includes: string[];
  built_in: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Resolve the ingress-aware base path for all API calls. */
function basePath(): string {
  if (typeof window !== "undefined" && (window as any).__ingress_path) {
    return (window as any).__ingress_path;
  }
  return "";
}

/** Build a full API URL with ingress prefix. */
function apiUrl(path: string): string {
  return `${basePath()}${path}`;
}

/** Standard JSON headers for POST/PATCH/PUT. */
const JSON_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

/**
 * Parse a JSON response, throwing on non-ok status.
 * Returns undefined for 204 No Content.
 */
async function parseResponse<T>(res: Response): Promise<T | undefined> {
  if (res.status === 204) return undefined;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ── Client ─────────────────────────────────────────────────────────────────

/**
 * Typed client-side API for task operations.
 * All methods use safeFetch under the hood for timeout + flood protection.
 */
export const taskApi = {
  // ── Tasks CRUD ────────────────────────────────────────────────────

  /** GET /api/tasks — list all tasks */
  async listTasks(params?: Record<string, string>): Promise<any[]> {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await safeFetch(apiUrl(`/api/tasks${qs}`));
    return (await parseResponse<any[]>(res)) ?? [];
  },

  /** GET /api/tasks/:id — single task */
  async getTask(id: string): Promise<any> {
    const res = await safeFetch(apiUrl(`/api/tasks/${encodeURIComponent(id)}`));
    return parseResponse<any>(res);
  },

  /** POST /api/tasks — create a task */
  async createTask(payload: TaskCreatePayload): Promise<any> {
    const res = await safeFetch(apiUrl("/api/tasks"), {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
    return parseResponse<any>(res);
  },

  /** PATCH /api/tasks/:id — update a task */
  async updateTask(id: string, payload: TaskPatchPayload): Promise<any> {
    const res = await safeFetch(apiUrl(`/api/tasks/${encodeURIComponent(id)}`), {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
    return parseResponse<any>(res);
  },

  /** DELETE /api/tasks/:id — delete a task */
  async deleteTask(id: string): Promise<void> {
    await safeFetch(apiUrl(`/api/tasks/${encodeURIComponent(id)}`), {
      method: "DELETE",
    });
  },

  /** POST /api/tasks/reorder — reorder kanban tasks */
  async reorderTasks(payload: ReorderPayload[]): Promise<any> {
    const res = await safeFetch(apiUrl("/api/tasks/reorder"), {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
    return parseResponse<any>(res);
  },

  // ── Settings ──────────────────────────────────────────────────────

  /** GET /api/settings — fetch all settings */
  async getSettings(): Promise<Record<string, any>> {
    const res = await safeFetch(apiUrl("/api/settings"));
    return (await parseResponse<Record<string, any>>(res)) ?? {};
  },

  /** PUT /api/settings — save settings */
  async saveSettings(payload: Record<string, unknown>): Promise<any> {
    const res = await safeFetch(apiUrl("/api/settings"), {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
    return parseResponse<any>(res);
  },

  // ── Lanes ─────────────────────────────────────────────────────────

  /** GET /api/lanes — fetch kanban lanes */
  async getLanes(): Promise<LanePayload[]> {
    const res = await safeFetch(apiUrl("/api/lanes"));
    return (await parseResponse<LanePayload[]>(res)) ?? [];
  },

  /** PUT /api/lanes/:id — update a lane */
  async updateLane(id: string, payload: Partial<LanePayload>): Promise<any> {
    const res = await safeFetch(apiUrl(`/api/lanes/${encodeURIComponent(id)}`), {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
    return parseResponse<any>(res);
  },

  /** DELETE /api/lanes/:id — delete a lane */
  async deleteLane(id: string): Promise<void> {
    await safeFetch(apiUrl(`/api/lanes/${encodeURIComponent(id)}`), {
      method: "DELETE",
    });
  },

  /** POST /api/lanes — create a lane */
  async createLane(payload: Partial<LanePayload>): Promise<any> {
    const res = await safeFetch(apiUrl("/api/lanes"), {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
    return parseResponse<any>(res);
  },

  // ── Users ─────────────────────────────────────────────────────────

  /** GET /api/users — list users */
  async listUsers(): Promise<any[]> {
    const res = await safeFetch(apiUrl("/api/users"));
    return (await parseResponse<any[]>(res)) ?? [];
  },

  // ── Todo Sync ─────────────────────────────────────────────────────

  /** GET /api/todo — list HA to-do entities */
  async listTodoEntities(): Promise<any[]> {
    const res = await safeFetch(apiUrl("/api/todo"));
    return (await parseResponse<any[]>(res)) ?? [];
  },

  /** POST /api/todo/sync — trigger todo sync */
  async syncTodo(payload: Record<string, unknown>): Promise<any> {
    const res = await safeFetch(apiUrl("/api/todo/sync"), {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
    return parseResponse<any>(res);
  },

  // ── Raw fetch (escape hatch) ──────────────────────────────────────

  /** Raw safeFetch with ingress prefix — for endpoints not covered above */
  async raw(path: string, options?: SafeFetchOptions): Promise<Response> {
    return safeFetch(apiUrl(path), options);
  },
} as const;

/** Re-export for convenience */
export { apiUrl, basePath };
