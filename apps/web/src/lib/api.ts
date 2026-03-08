/**
 * Typed API fetch utility — CQ-03
 *
 * Provides a consistent, typed wrapper around `fetch` for client-side API calls.
 * Works seamlessly behind HA ingress (leverages Layout.astro's global fetch interceptor).
 *
 * @domain lib
 * @bounded-context api-client
 */

/** Discriminated union return type for API calls */
export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number }

/**
 * Typed GET request to an API endpoint.
 *
 * @param path - API path (e.g. "/api/tasks")
 * @param options - Optional fetch init overrides
 * @returns Discriminated union: `{ ok: true, data }` or `{ ok: false, error }`
 *
 * @example
 * ```ts
 * const result = await apiGet<{ tasks: Task[] }>("/api/tasks")
 * if (result.ok) {
 *   console.log(result.data.tasks)
 * } else {
 *   showToast(result.error, "error")
 * }
 * ```
 */
export async function apiGet<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      ...options,
      method: "GET",
      headers: {
        accept: "application/json",
        ...options?.headers,
      },
    })

    if (res.ok) {
      const data = (await res.json()) as T
      return { ok: true, data, status: res.status }
    }

    const text = await res.text().catch(() => res.statusText)
    return { ok: false, error: text || `HTTP ${res.status}`, status: res.status }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    }
  }
}

/**
 * Typed POST/PUT/PATCH/DELETE request to an API endpoint.
 *
 * @param path - API path (e.g. "/api/tasks")
 * @param method - HTTP method
 * @param body - Request body (will be serialized to JSON)
 * @param options - Optional fetch init overrides
 * @returns Discriminated union: `{ ok: true, data }` or `{ ok: false, error }`
 *
 * @example
 * ```ts
 * const result = await apiMutate<{ id: string }>("/api/tasks", "POST", { title: "New task" })
 * if (result.ok) {
 *   showToast(`Created: ${result.data.id}`, "success")
 * }
 * ```
 */
export async function apiMutate<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      ...options,
      method,
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...options?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : null,
    })

    if (res.ok) {
      // DELETE may return 204 with no body
      if (res.status === 204) {
        return { ok: true, data: {} as T, status: res.status }
      }
      const data = (await res.json()) as T
      return { ok: true, data, status: res.status }
    }

    const text = await res.text().catch(() => res.statusText)
    return { ok: false, error: text || `HTTP ${res.status}`, status: res.status }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    }
  }
}
