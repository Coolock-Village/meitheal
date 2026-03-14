---
phase: 06-kanban-overhaul
plan: 03
subsystem: kanban-ui
tags: [kanban, inline-styles, board-filter, toolbar, code-quality]
key_files:
  modified: [apps/web/src/pages/kanban.astro, apps/web/src/styles/_kanban.css]
metrics:
  completed: 2026-03-14
---

# Phase 6 Plan 03: Inline Style Migration + Board Filter Summary

**One-liner:** Migrated 3 high-impact inline styles to CSS classes, added board filter dropdown to toolbar with localStorage persistence and sidebar sync.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `7f0344e` | Inline styles → CSS classes (card-title, ticket-key, swimlane-add-btn) |
| 2 | `4ba6be9` | Board filter dropdown in toolbar with sidebar sync |

## Changes
- **Task 1**: `kanban-card-title`, `kanban-ticket-key`, `swimlane-add-btn` CSS classes
  - Inline style count: 29 → 26 (3 migrated)
- **Task 2**: Board filter `<select>` in toolbar bar
  - Populated from `/api/boards` on load
  - Filters cards by `data-board` attribute
  - Persists in `localStorage` (key: `meitheal-kanban-board-filter`)
  - Syncs with sidebar via `CustomEvent` (board-filter-change / board-changed)

## Self-Check: PASSED
