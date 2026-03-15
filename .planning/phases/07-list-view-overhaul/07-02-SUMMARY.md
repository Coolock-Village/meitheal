---
phase: "07"
plan: "02"
subsystem: shared-filter-toolbar
status: COMPLETED
completed: 2026-03-14
---

# Phase 7 Plan 02: Shared FilterToolbar Component (Completed)

## Goal Achieved
Successfully extracted `FilterToolbar.astro` and deployed it across both the **Table** and **Kanban** views. We replaced independent, inline filtering logic (~300 lines removed from Kanban alone) with a centralized approach driven by CustomEvents (`meitheal:filter-change`) and a shared persistence utility (`filter-state.ts`).

## Completed Tasks

### 1. Unified state (`filter-state.ts`)
- Added centralized localStorage + URL param syncing for all dimensions: search, status, priority, rice, user, board, type, labels, groupBy, subGroupBy.
- Exposed a unified visibility checker: `isTaskVisible()`.
- Implemented `getGroupKey()` and `getGroupDisplay()` to standardize swimlane logic.

### 2. FilterToolbar.astro
- Created a robust, customizable toolbar component.
- Implemented configurable props (`showStatusFilter`, `showPriorityFilter`, etc.) so it can adapt to Kanban and Table specific needs.
- Embedded `LabelFilterBar` directly into it.
- Bound all inputs to emit a single `meitheal:filter-change` CustomEvent.

### 3. Consumer Integration
- **Table view**: Removed ~100 lines of inline HTML, swapping in `<FilterToolbar>`. Refactored `table-controller.ts` to consume the unified CustomEvent.
- **Kanban view**: Replaced the entire type-filter and event-listener stack inside `kanban.astro`'s inline script. Hooked into the single CustomEvent and used `window.__isTaskVisible` exactly as Table view does. 
- Maintained all expected behaviors including dynamic swimlanes, column counting, and persistent collapse states.

### 4. Verification
- `pnpm check` and `pnpm test` pass.
- No regressions in E2E behavior. Both list views now feel identical to use in terms of filtering capabilities.
