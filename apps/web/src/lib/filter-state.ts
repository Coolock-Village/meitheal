/**
 * Shared Filter State — Client-side filter persistence utilities
 *
 * Centralizes filter state saving/loading across tasks, table, and
 * any future view pages. URL params take priority over localStorage
 * for deep-linking support.
 *
 * Bounded Context: Tasks (view-layer utility)
 */

// =============================================================================
// Types
// =============================================================================

export interface FilterState {
  search: string
  status: string
  priority: string
  rice: string
  sort: string
  user: string
}

// =============================================================================
// Constants
// =============================================================================

/** Shared localStorage key — so switching between tasks/table preserves filters */
export const FILTER_STORAGE_KEY = "meitheal-task-view-filters"

/** Default sort order for task lists */
export const DEFAULT_SORT = "created_at-desc"

/** Valid status filter values including the computed 'overdue' pseudo-status */
export const STATUS_VALUES = ["pending", "active", "complete", "overdue"] as const

// =============================================================================
// Persistence
// =============================================================================

/**
 * Save filter state to both localStorage and URL search params.
 * Keeps the URL in sync for deep-linking / share support.
 */
export function saveFilterState(state: Partial<FilterState>): void {
  localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state))

  const url = new URL(window.location.href)
  for (const [key, val] of Object.entries(state)) {
    if (val && val !== DEFAULT_SORT) {
      url.searchParams.set(key, val)
    } else {
      url.searchParams.delete(key)
    }
  }
  window.history.replaceState(null, "", url.toString())
}

/**
 * Load filter state from URL search params (priority) or localStorage.
 * Returns a partial state — callers apply only the fields they support.
 */
export function loadFilterState(): Partial<FilterState> {
  const urlParams = new URLSearchParams(window.location.search)
  const hasUrlFilters =
    urlParams.has("search") ||
    urlParams.has("status") ||
    urlParams.has("priority") ||
    urlParams.has("rice") ||
    urlParams.has("sort") ||
    urlParams.has("user")

  if (hasUrlFilters) {
    return {
      search: urlParams.get("search") ?? "",
      status: urlParams.get("status") ?? "",
      priority: urlParams.get("priority") ?? "",
      rice: urlParams.get("rice") ?? "",
      sort: urlParams.get("sort") ?? DEFAULT_SORT,
      user: urlParams.get("user") ?? "",
    }
  }

  try {
    return JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) ?? "{}")
  } catch {
    return {}
  }
}

/**
 * Clear all filter state from localStorage and URL params.
 */
export function clearFilterState(): void {
  localStorage.removeItem(FILTER_STORAGE_KEY)
  const url = new URL(window.location.href)
  for (const key of ["search", "status", "priority", "rice", "sort", "user"]) {
    url.searchParams.delete(key)
  }
  window.history.replaceState(null, "", url.toString())
}

// =============================================================================
// Status Matching
// =============================================================================

/**
 * Check if a task element matches the current status filter.
 * Handles the 'overdue' pseudo-status by checking data-overdue attribute.
 */
export function matchesStatusFilter(
  el: HTMLElement,
  statusFilter: string,
): boolean {
  if (!statusFilter) return true
  if (statusFilter === "overdue") {
    return el.dataset.overdue === "true"
  }
  return el.dataset.status === statusFilter
}

/**
 * Check if a task element matches the current RICE filter.
 */
export function matchesRiceFilter(
  el: HTMLElement,
  riceFilter: string,
): boolean {
  if (!riceFilter) return true
  const riceVal = el.dataset.rice
  if (!riceVal) return false
  const r = Number(riceVal)
  if (riceFilter === "high") return r >= 15
  if (riceFilter === "medium") return r >= 8 && r < 15
  if (riceFilter === "low") return r < 8
  return false
}
