---
phase: "07"
plan: "01"
subsystem: table-view
tags: [list-view, grouping, filters, swimlanes, bulk-actions]
dependency_graph:
  requires: []
  provides: [table-grouping, unified-filter-state, type-toggles, board-filter, enhanced-bulk-bar]
  affects: [filter-state, table-controller, table-css]
tech_stack:
  added: []
  patterns: [client-side-grouping, stale-filter-protection, sort-within-groups]
key_files:
  created: []
  modified:
    - apps/web/src/lib/filter-state.ts
    - apps/web/src/pages/table.astro
    - apps/web/src/lib/table-controller.ts
    - apps/web/src/styles/_table.css
decisions:
  - Client-side grouping over SSR for instant group changes without page reload
  - Stale filter auto-clear ensures tasks always visible on first load
  - Subtask tree and grouping are mutually exclusive by design
  - Group collapse state persisted via sessionStorage (session-scoped, not localStorage)
  - Enhanced bulk bar with priority and board actions to match Teamhood
metrics:
  duration: "~25 minutes"
  completed: "2026-03-14"
---

# Phase 7 Plan 01: Table Row Grouping + Extended Filters Summary

Extended the table/list view with Teamhood-style collapsible row grouping and enhanced filter dimensions.

## Commits

| SHA | Type | Description |
|-----|------|-------------|
| `2c1d204` | feat | Extend filter-state with board/types/groupBy/labels dimensions |
| `c477496` | feat | Add table row grouping, type/board filters, enhanced bulk bar |
| `6700fc7` | fix | Protect against stale localStorage filter state on initial load |

## What Was Built

### filter-state.ts — Extended shared filter infrastructure
- Added `board`, `types[]`, `groupBy`, `subGroupBy`, `labels[]` to `FilterState`
- Added unified `isTaskVisible()` — checks ALL filter dimensions in one call
- Added `getGroupKey()` and `getGroupDisplay()` — group classification helpers
- Added `RICE_BANDS`, `GROUP_BY_OPTIONS` constants
- Array fields serialize/deserialize as comma-separated URL params

### table.astro — Enhanced filter bar + data attributes
- Type toggle buttons (Epic/Story/Task) with active state styling
- Board filter dropdown (populated client-side from `/api/boards`)
- Group-by selector (None/Type/Priority/Board/Assignee/Status/RICE)
- Added `data-task-type` attribute to all table rows
- Enhanced bulk bar: priority, board, and close button (Teamhood parity)

### table-controller.ts — Complete rewrite with grouping engine
- Client-side row grouping with collapsible group headers
- Group headers show: toggle arrow, color dot, icon, label, count badge, select-all checkbox
- Group collapse/expand with sessionStorage persistence
- Sort-within-groups: sorting respects group boundaries
- Unified `applyAllFilters()` using shared `isTaskVisible()`
- Board selector auto-population from `/api/boards`
- User filter population from task data attributes
- Subtask tree ↔ grouping mutex (tree disabled during grouping)
- Stale filter auto-clear: if restored state hides ALL tasks, auto-reset

### _table.css — Group header and toggle styles
- `.group-header-row` with color-coded dot, collapse animation
- `.type-toggles` with active/inactive states
- `.filtered-out` unified visibility class
- Enhanced bulk bar styles (divider, close button)
- Responsive toolbar for narrow HA ingress viewport

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale localStorage filter state**
- **Found during:** Verification (browser test)
- **Issue:** Restored filter state from previous session hid all tasks on page load
- **Fix:** Added init-time detection — if ALL tasks are hidden, auto-clear stale state
- **Files modified:** `table-controller.ts`
- **Commit:** `6700fc7`

**2. [Rule 2 - Missing] Enhanced bulk bar**
- **Found during:** User feedback with Teamhood screenshot
- **Issue:** Bulk bar only had status + delete; Teamhood has priority, assignee, board, etc.
- **Fix:** Added priority and board bulk actions, close button
- **Files modified:** `table.astro`, `table-controller.ts`
- **Commit:** `c477496`

## Verification

- [x] `pnpm check` (typecheck) — zero errors
- [x] `pnpm test` — 285 passed, 1 pre-existing failure (sw.js version governance, unrelated)
- [x] Browser: tasks visible on initial load (stale filter fix verified)
- [x] Browser: group-by status shows group headers with correct counts
- [x] Browser: type toggles visible and functional
- [x] Browser: board filter present and populated
- [x] Browser: collapsible groups work (collapse/expand)
- [x] Browser: all existing filters preserved (search, status, priority, RICE, user, labels)

## Self-Check: PASSED

All created/modified files exist and all commits verified in git log.
