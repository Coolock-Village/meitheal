/**
 * Table controller — extracted from table.astro
 *
 * Handles: subtask tree expand/collapse, filtering (text/status/priority/rice/user/label),
 * inline editing, inline select changes, row click → detail panel, delete rows,
 * bulk actions (status change, bulk delete), column sorting, table scroll detection.
 */
import { showToast } from "@lib/toast"
import { confirmDialog } from "@lib/confirm-dialog"
import { taskApi } from "../lib/task-api-client"

// ── Subtask tree expand/collapse ────────────────────────────
const COLLAPSE_KEY = "meitheal-table-collapsed"
const collapsedParents = new Set<string>(
  JSON.parse(sessionStorage.getItem(COLLAPSE_KEY) ?? "[]")
)

function saveCollapsedState() {
  sessionStorage.setItem(COLLAPSE_KEY, JSON.stringify([...collapsedParents]))
}

function getDescendantIds(parentId: string): string[] {
  const ids: string[] = []
  const row = document.querySelector(`tr[data-id="${parentId}"]`)
  const childIds = row?.getAttribute("data-child-ids")?.split(",").filter(Boolean) ?? []
  for (const cid of childIds) {
    ids.push(cid)
    ids.push(...getDescendantIds(cid))
  }
  return ids
}

function toggleSubtree(parentId: string, collapse: boolean) {
  const descendants = getDescendantIds(parentId)
  for (const did of descendants) {
    const row = document.querySelector(`tr[data-id="${did}"]`) as HTMLElement
    if (row) {
      row.style.display = collapse ? "none" : ""
      // If this descendant is also collapsed, keep its children hidden
      if (!collapse && collapsedParents.has(did)) {
        const subDescendants = getDescendantIds(did)
        for (const sd of subDescendants) {
          const subRow = document.querySelector(`tr[data-id="${sd}"]`) as HTMLElement
          if (subRow) subRow.style.display = "none"
        }
      }
    }
  }
}

// Initialize collapse state
for (const pid of collapsedParents) {
  toggleSubtree(pid, true)
  const btn = document.querySelector(`.subtree-toggle[data-parent-id="${pid}"]`) as HTMLElement
  if (btn) {
    btn.textContent = "▸"
    btn.setAttribute("aria-expanded", "false")
  }
}

// Bind toggle buttons
document.querySelectorAll(".subtree-toggle").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation()
    const parentId = (btn as HTMLElement).getAttribute("data-parent-id")!
    const isCollapsed = collapsedParents.has(parentId)
    if (isCollapsed) {
      collapsedParents.delete(parentId)
      toggleSubtree(parentId, false)
      ;(btn as HTMLElement).textContent = "▾"
      btn.setAttribute("aria-expanded", "true")
    } else {
      collapsedParents.add(parentId)
      toggleSubtree(parentId, true)
      ;(btn as HTMLElement).textContent = "▸"
      btn.setAttribute("aria-expanded", "false")
    }
    saveCollapsedState()
  })
})

const FILTER_KEY = "meitheal-task-view-filters"

// Label filter state — updated by LabelFilterBar events
let activeLabelFilter: string[] = []

document.addEventListener("meitheal:label-filter", ((e: CustomEvent) => {
  activeLabelFilter = e.detail?.labels ?? []
  applyTableFilters()
}) as EventListener)


// ── Filtering — parity with tasks page, shared localStorage key ──

// Populate user filter dropdown from data-assigned attributes
;(function populateUserFilter() {
  const userSelect = document.getElementById(
    "table-filter-user",
  ) as HTMLSelectElement
  if (!userSelect) return
  const users = new Set<string>()
  document.querySelectorAll("#task-table tbody tr").forEach((row) => {
    const assigned = (row as HTMLElement).dataset.assigned
    if (assigned) users.add(assigned)
  })
  Array.from(users)
    .sort()
    .forEach((user) => {
      const opt = document.createElement("option")
      opt.value = user
      opt.textContent = user.replace(/^(ha_|custom_)/, "")
      userSelect.appendChild(opt)
    })
})()

function applyTableFilters() {
  const searchVal =
    (
      document.getElementById("table-search") as HTMLInputElement
    )?.value.toLowerCase() ?? ""
  const statusFilter =
    (document.getElementById("table-filter-status") as HTMLSelectElement)
      ?.value ?? ""
  const priorityFilter =
    (document.getElementById("table-filter-priority") as HTMLSelectElement)
      ?.value ?? ""
  const riceFilter =
    (document.getElementById("table-filter-rice") as HTMLSelectElement)
      ?.value ?? ""
  const userFilter =
    (document.getElementById("table-filter-user") as HTMLSelectElement)
      ?.value ?? ""

  document.querySelectorAll("#task-table tbody tr").forEach((row) => {
    const el = row as HTMLElement
    const title = el.dataset.search ?? el.dataset.title ?? ""
    const matchSearch = !searchVal || title.includes(searchVal)
    const matchStatus = !statusFilter || el.dataset.status === statusFilter
    const matchPriority =
      !priorityFilter || el.dataset.priority === priorityFilter

    let matchRice = true
    if (riceFilter) {
      const riceVal = el.dataset.rice
      if (!riceVal) {
        matchRice = false
      } else {
        const r = Number(riceVal)
        if (riceFilter === "high") matchRice = r >= 15
        else if (riceFilter === "medium") matchRice = r >= 8 && r < 15
        else if (riceFilter === "low") matchRice = r < 8
      }
    }

    let matchUser = true
    if (userFilter === "__unassigned__") {
      matchUser = !el.dataset.assigned
    } else if (userFilter) {
      matchUser = el.dataset.assigned === userFilter
    }

    // Label filter matching
    let matchLabel = true
    if (activeLabelFilter.length > 0) {
      try {
        const rowLabels = JSON.parse(el.dataset.labels ?? "[]") as (string | { name: string })[]
        const labelNames = rowLabels.map((l) =>
          (typeof l === "string" ? l : l.name ?? "").toLowerCase()
        )
        matchLabel = activeLabelFilter.some((f) =>
          labelNames.includes(f.toLowerCase())
        )
      } catch {
        matchLabel = false
      }
    }

    const visible =
      matchSearch && matchStatus && matchPriority && matchRice && matchUser && matchLabel
    el.style.display = visible ? "" : "none"
  })

  saveFilterState()
}

function saveFilterState() {
  const state = {
    search:
      (document.getElementById("table-search") as HTMLInputElement)
        ?.value ?? "",
    status:
      (document.getElementById("table-filter-status") as HTMLSelectElement)
        ?.value ?? "",
    priority:
      (
        document.getElementById(
          "table-filter-priority",
        ) as HTMLSelectElement
      )?.value ?? "",
    rice:
      (document.getElementById("table-filter-rice") as HTMLSelectElement)
        ?.value ?? "",
    user:
      (document.getElementById("table-filter-user") as HTMLSelectElement)
        ?.value ?? "",
  }
  localStorage.setItem(FILTER_KEY, JSON.stringify(state))

  // Sync to URL for deep-linking
  const url = new URL(window.location.href)
  Object.entries(state).forEach(([key, val]) => {
    if (val) url.searchParams.set(key, val)
    else url.searchParams.delete(key)
  })
  window.history.replaceState(null, "", url.toString())
}

// Attach filter listeners
;[
  "table-search",
  "table-filter-status",
  "table-filter-priority",
  "table-filter-rice",
  "table-filter-user",
].forEach((id) => {
  const el = document.getElementById(id)
  if (!el) return
  el.addEventListener(
    id === "table-search" ? "input" : "change",
    applyTableFilters,
  )
})

// Clear all filters
document.getElementById("clear-filters")?.addEventListener("click", () => {
  ;(document.getElementById("table-search") as HTMLInputElement).value = ""
  ;(
    document.getElementById("table-filter-status") as HTMLSelectElement
  ).value = ""
  ;(
    document.getElementById("table-filter-priority") as HTMLSelectElement
  ).value = ""
  ;(
    document.getElementById("table-filter-rice") as HTMLSelectElement
  ).value = ""
  ;(
    document.getElementById("table-filter-user") as HTMLSelectElement
  ).value = ""
  applyTableFilters()
})

// Restore filter state — URL params take priority, then localStorage
try {
  const urlParams = new URLSearchParams(window.location.search)
  const hasUrlFilters =
    urlParams.has("search") ||
    urlParams.has("status") ||
    urlParams.has("priority") ||
    urlParams.has("rice") ||
    urlParams.has("user")

  const source = hasUrlFilters
    ? {
        search: urlParams.get("search") ?? "",
        status: urlParams.get("status") ?? "",
        priority: urlParams.get("priority") ?? "",
        rice: urlParams.get("rice") ?? "",
        user: urlParams.get("user") ?? "",
      }
    : JSON.parse(localStorage.getItem(FILTER_KEY) ?? "{}")

  if (source.search)
    (document.getElementById("table-search") as HTMLInputElement).value =
      source.search
  if (source.status)
    (
      document.getElementById("table-filter-status") as HTMLSelectElement
    ).value = source.status
  if (source.priority)
    (
      document.getElementById("table-filter-priority") as HTMLSelectElement
    ).value = source.priority
  if (source.rice)
    (
      document.getElementById("table-filter-rice") as HTMLSelectElement
    ).value = source.rice
  if (source.user)
    (
      document.getElementById("table-filter-user") as HTMLSelectElement
    ).value = source.user
  if (
    source.search ||
    source.status ||
    source.priority ||
    source.rice ||
    source.user
  )
    applyTableFilters()
} catch {
  /* ignore */
}

// ── Inline editing — with empty-revert ──────────────────────

document.querySelectorAll(".editable-cell").forEach((cell) => {
  cell.addEventListener("blur", async () => {
    const el = cell as HTMLElement
    const id = el.dataset.id
    const field = el.dataset.field
    const value = el.textContent?.trim()
    const original = el.dataset.original ?? ""

    // Revert to original value if user cleared the field
    if (!id || !field || !value) {
      if (original) el.textContent = original
      return
    }

    // No change — skip API call
    if (value === original) return

    try {
      await taskApi.updateTask(id, { [field]: value })
      el.dataset.original = value // Update stored original
      showToast("common.updated")
    } catch {
      el.textContent = original // Revert on error
      showToast("common.failed", "error")
    }
  })
  cell.addEventListener("keydown", (e: Event) => {
    if ((e as KeyboardEvent).key === "Enter") {
      (e as KeyboardEvent).preventDefault()
      ;(cell as HTMLElement).blur()
    }
  })
})

// ── Inline select changes ───────────────────────────────────

document.querySelectorAll(".inline-select").forEach((sel) => {
  sel.addEventListener("change", async (e) => {
    const el = e.target as HTMLSelectElement
    const id = el.dataset.id
    const field = el.dataset.field
    try {
      const value = field === "priority" ? Number(el.value) : el.value
      await taskApi.updateTask(id!, { [field!]: value })
      showToast(
        field === "priority"
          ? "table.priority_updated"
          : "table.status_updated",
      )
      if (field === "status") {
        const row = el.closest("tr")
        if (el.value === "complete") {
          row?.classList.add("row-done")
        } else {
          row?.classList.remove("row-done")
        }
      }
      // Update priority class color
      if (field === "priority") {
        const classes = [
          "priority-critical",
          "priority-high",
          "priority-medium",
          "priority-low",
          "priority-minimal",
        ]
        el.classList.remove(...classes)
        const idx = Number(el.value) - 1
        if (classes[idx]) el.classList.add(classes[idx])
      }
    } catch {
      showToast("common.failed", "error")
    }
  })
})

// ── Row click → open task detail panel ──────────────────────

document.querySelectorAll("#task-table tbody tr").forEach((row) => {
  row.addEventListener("click", (e) => {
    const target = e.target as HTMLElement
    // Don't trigger on interactive elements or their containers
    if (
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.closest("select") ||
      target.closest("input") ||
      target.contentEditable === "true" ||
      target.closest("[contenteditable]")
    ) {
      return
    }
    const id = (row as HTMLElement).dataset.id
    if (id) {
      document.dispatchEvent(
        new CustomEvent("meitheal:open-task-detail", { detail: { id } }),
      )
    }
  })
})

// ── Delete rows ─────────────────────────────────────────────

document.querySelectorAll(".delete-row").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.stopPropagation()
    const id = (btn as HTMLElement).dataset.id
    const ok = await confirmDialog({
      message: "This task will be permanently deleted.",
      variant: "danger",
      confirmText: "Delete",
      title: "Delete Task",
    })
    if (!ok) return
    try {
      await taskApi.deleteTask(id!)
      showToast("common.task_deleted")
      ;(btn as HTMLElement).closest("tr")?.remove()
    } catch {
      showToast("common.failed_delete", "error")
    }
  })
})

// ── Bulk actions ────────────────────────────────────────────

const selectAll = document.getElementById("select-all") as HTMLInputElement
const bulkBar = document.getElementById("bulk-bar")!
const selectedCount = document.getElementById("selected-count")!

function updateBulkBar() {
  const checked = document.querySelectorAll(".row-check:checked")
  if (checked.length > 0) {
    bulkBar.style.display = "flex"
    selectedCount.textContent = `${checked.length} selected`
  } else {
    bulkBar.style.display = "none"
  }
}

selectAll?.addEventListener("change", () => {
  document.querySelectorAll(".row-check").forEach((cb) => {
    ;(cb as HTMLInputElement).checked = selectAll.checked
  })
  updateBulkBar()
})

document.querySelectorAll(".row-check").forEach((cb) => {
  // Prevent row click from intercepting checkbox interactions
  cb.addEventListener("click", (e) => e.stopPropagation())
  cb.addEventListener("change", updateBulkBar)
})

// Bulk status change
document
  .getElementById("bulk-status")
  ?.addEventListener("change", async (e) => {
    const newStatus = (e.target as HTMLSelectElement).value
    if (!newStatus) return
    const checked = document.querySelectorAll(".row-check:checked")
    try {
      const promises = Array.from(checked).map((cb) =>
        taskApi.updateTask((cb as HTMLElement).dataset.id!, { status: newStatus }),
      )
      await Promise.all(promises)
      showToast(`${checked.length} tasks updated`)
      checked.forEach((cb) => {
        const row = cb.closest("tr")
        const select = row?.querySelector(
          "select.inline-select",
        ) as HTMLSelectElement
        if (select) select.value = newStatus
        if (newStatus === "complete") {
          row?.classList.add("row-done")
        } else {
          row?.classList.remove("row-done")
        }
      })
      bulkBar.style.display = "none"
    } catch {
      showToast("table.bulk_update_failed", "error")
    }
  })

// Bulk delete
document
  .getElementById("bulk-delete")
  ?.addEventListener("click", async () => {
    const checked = document.querySelectorAll(".row-check:checked")
    const ok = await confirmDialog({
      message: `Delete ${checked.length} selected tasks? This cannot be undone.`,
      variant: "danger",
      confirmText: `Delete ${checked.length} Tasks`,
      title: "Bulk Delete",
    })
    if (!ok) return
    try {
      const promises = Array.from(checked).map((cb) =>
        taskApi.deleteTask((cb as HTMLElement).dataset.id!),
      )
      await Promise.all(promises)
      showToast(`${checked.length} tasks deleted`)
      checked.forEach((cb) => cb.closest("tr")?.remove())
      bulkBar.style.display = "none"
    } catch {
      showToast("table.bulk_delete_failed", "error")
    }
  })

// ── Column sorting — with numeric comparison fix ────────────

document.querySelectorAll(".sortable").forEach((th) => {
  th.addEventListener("click", () => {
    const col = (th as HTMLElement).dataset.col
    const isNumeric = (th as HTMLElement).dataset.numeric === "true"
    const tbody = document.querySelector("#task-table tbody")
    if (!tbody || !col) return
    const rows = Array.from(tbody.querySelectorAll("tr"))
    const asc = !(th as HTMLElement).classList.contains("sort-asc")
    document.querySelectorAll(".sortable").forEach((h) => {
      h.classList.remove("sort-asc", "sort-desc")
      const indicator = h.querySelector(".sort-indicator")
      if (indicator) indicator.textContent = ""
    })
    ;(th as HTMLElement).classList.add(asc ? "sort-asc" : "sort-desc")
    const sortIndicator = (th as HTMLElement).querySelector(
      ".sort-indicator",
    )
    if (sortIndicator) sortIndicator.textContent = asc ? " ▲" : " ▼"

    rows.sort((a, b) => {
      let aVal: string
      let bVal: string

      // Get value from data attribute or cell content
      if (col === "rice") {
        aVal = (a as HTMLElement).dataset.rice ?? "0"
        bVal = (b as HTMLElement).dataset.rice ?? "0"
      } else if (col === "priority") {
        aVal = (a as HTMLElement).dataset.priority ?? "3"
        bVal = (b as HTMLElement).dataset.priority ?? "3"
      } else {
        aVal =
          a.querySelector(`[data-field="${col}"]`)?.textContent?.trim() ??
          ""
        bVal =
          b.querySelector(`[data-field="${col}"]`)?.textContent?.trim() ??
          ""
      }

      // Numeric comparison for priority and RICE columns
      if (isNumeric || col === "rice" || col === "priority") {
        const aNum = Number(aVal) || 0
        const bNum = Number(bVal) || 0
        return asc ? aNum - bNum : bNum - aNum
      }

      return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
    rows.forEach((r) => tbody.appendChild(r))
  })
})

// ── Detect table horizontal overflow for scroll shadow ──────
const tableContainer = document.querySelector(".table-container")
if (tableContainer) {
  const checkScroll = () => {
    const hasScroll =
      tableContainer.scrollWidth > tableContainer.clientWidth
    tableContainer.classList.toggle("has-scroll", hasScroll)
  }
  checkScroll()
  // Cleanup previous resize listener to prevent accumulation
  if ((window as any).__tableResizeCleanup) (window as any).__tableResizeCleanup()
  const ac = new AbortController()
  window.addEventListener("resize", checkScroll, { signal: ac.signal })
  ;(window as any).__tableResizeCleanup = () => ac.abort()
}
