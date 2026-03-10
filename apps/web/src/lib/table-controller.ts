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
import {
  saveFilterState as persistFilters,
  loadFilterState,
  matchesStatusFilter,
  matchesRiceFilter,
} from "@lib/filter-state"

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
    const matchStatus = matchesStatusFilter(el, statusFilter)
    const matchPriority =
      !priorityFilter || el.dataset.priority === priorityFilter

    const matchRice = matchesRiceFilter(el, riceFilter)

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

  // P2 T9: Re-apply collapse state — filters may have shown children of collapsed parents
  for (const pid of collapsedParents) {
    toggleSubtree(pid, true)
  }

  // P4 T14: Show/hide no-results row
  const visibleRows = document.querySelectorAll("#task-table tbody tr:not(.no-results-row)")
  const anyVisible = Array.from(visibleRows).some(
    (r) => (r as HTMLElement).style.display !== "none"
  )
  const noResultsRow = document.querySelector(".no-results-row") as HTMLElement | null
  if (noResultsRow) noResultsRow.style.display = anyVisible ? "none" : ""

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
  persistFilters(state)
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
  const source = loadFilterState()

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
      // P1 T7: Keep data-search/data-title in sync for filtering after inline edit
      if (field === "title") {
        const row = el.closest("tr") as HTMLElement | null
        if (row) {
          row.dataset.title = value.toLowerCase()
          const desc = row.dataset.search?.split("\n")[1] ?? ""
          row.dataset.search = [value, desc].join(" ").toLowerCase()
        }
      }
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
      const row = el.closest("tr") as HTMLElement | null
      if (field === "status" && row) {
        // P0 T1: Keep data-status in sync so filters work after inline change
        row.dataset.status = el.value
        if (el.value === "complete") {
          row.classList.add("row-done")
        } else {
          row.classList.remove("row-done")
        }
      }
      if (field === "priority" && row) {
        // P0 T2: Keep data-priority in sync so sorting/filtering works
        row.dataset.priority = el.value
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
      // P2 T10: Update bulk bar after row removal
      updateBulkBar()
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
  // P1 T5: Only select visible rows — skip hidden/filtered rows
  document.querySelectorAll(".row-check").forEach((cb) => {
    const row = cb.closest("tr") as HTMLElement | null
    if (row && row.style.display !== "none") {
      ;(cb as HTMLInputElement).checked = selectAll.checked
    } else {
      ;(cb as HTMLInputElement).checked = false
    }
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
    const checked = Array.from(document.querySelectorAll(".row-check:checked"))
    // P3 T12: Disable bulk bar during operation
    const bulkBtns = bulkBar.querySelectorAll("button, select") as NodeListOf<HTMLButtonElement | HTMLSelectElement>
    bulkBtns.forEach((b) => (b.disabled = true))
    selectedCount.textContent = `Processing ${checked.length}…`
    let ok = 0
    let fail = 0
    for (const cb of checked) {
      try {
        await taskApi.updateTask((cb as HTMLElement).dataset.id!, { status: newStatus })
        ok++
        const row = cb.closest("tr") as HTMLElement | null
        const select = row?.querySelector("select.inline-select[data-field=\"status\"]") as HTMLSelectElement
        if (select) select.value = newStatus
        if (row) {
          // P0 T1 (bulk): Keep data-status in sync during bulk ops
          row.dataset.status = newStatus
          if (newStatus === "complete") row.classList.add("row-done")
          else row.classList.remove("row-done")
        }
      } catch {
        fail++
      }
      await new Promise((r) => setTimeout(r, 100))
    }
    // P3 T11: Structured toast instead of raw template literal
    showToast(fail ? `${ok} updated, ${fail} failed` : `${ok} tasks updated`)
    bulkBtns.forEach((b) => (b.disabled = false))
    ;(e.target as HTMLSelectElement).value = ""
    document.querySelectorAll(".row-check:checked").forEach((cb) => {
      ;(cb as HTMLInputElement).checked = false
    })
    updateBulkBar()
  })

// Bulk delete
document
  .getElementById("bulk-delete")
  ?.addEventListener("click", async () => {
    const checked = Array.from(document.querySelectorAll(".row-check:checked"))
    const ok = await confirmDialog({
      message: `Delete ${checked.length} selected tasks? This cannot be undone.`,
      variant: "danger",
      confirmText: `Delete ${checked.length} Tasks`,
      title: "Bulk Delete",
    })
    if (!ok) return
    // P3 T12: Disable bulk bar during operation
    const bulkBtns = bulkBar.querySelectorAll("button, select") as NodeListOf<HTMLButtonElement | HTMLSelectElement>
    bulkBtns.forEach((b) => (b.disabled = true))
    selectedCount.textContent = `Deleting ${checked.length}…`
    let deleted = 0
    let fail = 0
    for (const cb of checked) {
      try {
        await taskApi.deleteTask((cb as HTMLElement).dataset.id!)
        cb.closest("tr")?.remove()
        deleted++
      } catch {
        fail++
      }
      await new Promise((r) => setTimeout(r, 100))
    }
    showToast(fail ? `${deleted} deleted, ${fail} failed` : `${deleted} tasks deleted`)
    bulkBtns.forEach((b) => (b.disabled = false))
    updateBulkBar()
  })

// ── Column sorting — with numeric comparison fix ────────────

// P1 T4 + P2 T8: Subtask-aware sorting with proper date handling
function getSortValue(row: HTMLElement, col: string): string {
  if (col === "rice") return row.dataset.rice ?? "0"
  if (col === "priority") return row.dataset.priority ?? "3"
  if (col === "due_date") {
    // P2 T8: Extract raw date text from the cell
    const cell = row.querySelector(".td-due")
    const text = cell?.textContent?.trim()?.replace(/Overdue$/i, "").trim() ?? ""
    if (!text || text === "—") return "9999-12-31" // No date = sort to end
    return text
  }
  return row.querySelector(`[data-field="${col}"]`)?.textContent?.trim() ?? ""
}

function compareValues(aVal: string, bVal: string, col: string, asc: boolean, isNumeric: boolean): number {
  if (isNumeric || col === "rice" || col === "priority") {
    const aNum = Number(aVal) || 0
    const bNum = Number(bVal) || 0
    return asc ? aNum - bNum : bNum - aNum
  }
  if (col === "due_date") {
    // P2 T8: Date comparison — parse to timestamps
    const aTime = new Date(aVal).getTime() || Infinity
    const bTime = new Date(bVal).getTime() || Infinity
    return asc ? aTime - bTime : bTime - aTime
  }
  return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
}

document.querySelectorAll(".sortable").forEach((th) => {
  th.addEventListener("click", () => {
    const col = (th as HTMLElement).dataset.col
    const isNumeric = (th as HTMLElement).dataset.numeric === "true"
    const tbody = document.querySelector("#task-table tbody")
    if (!tbody || !col) return

    const asc = !(th as HTMLElement).classList.contains("sort-asc")
    document.querySelectorAll(".sortable").forEach((h) => {
      h.classList.remove("sort-asc", "sort-desc")
      const indicator = h.querySelector(".sort-indicator")
      if (indicator) indicator.textContent = ""
    })
    ;(th as HTMLElement).classList.add(asc ? "sort-asc" : "sort-desc")
    const sortIndicator = (th as HTMLElement).querySelector(".sort-indicator")
    if (sortIndicator) sortIndicator.textContent = asc ? " ▲" : " ▼"

    // P1 T4: Subtask-aware sort — sort roots only, keep children after parents
    const allRows = Array.from(tbody.querySelectorAll("tr")) as HTMLElement[]
    const rootRows = allRows.filter((r) => !r.dataset.parentId)
    const childMap = new Map<string, HTMLElement[]>()
    for (const r of allRows) {
      const pid = r.dataset.parentId
      if (pid) {
        if (!childMap.has(pid)) childMap.set(pid, [])
        childMap.get(pid)!.push(r)
      }
    }

    // Sort root rows
    rootRows.sort((a, b) => {
      const aVal = getSortValue(a, col)
      const bVal = getSortValue(b, col)
      return compareValues(aVal, bVal, col, asc, isNumeric)
    })

    // Rebuild: root followed by children (preserving child order)
    function appendWithChildren(row: HTMLElement) {
      tbody!.appendChild(row)
      const id = row.dataset.id
      if (id && childMap.has(id)) {
        for (const child of childMap.get(id)!) {
          appendWithChildren(child)
        }
      }
    }
    for (const root of rootRows) appendWithChildren(root)
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
