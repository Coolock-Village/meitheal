---
phase: 06-kanban-overhaul
plan: 01
subsystem: kanban-ui
tags: [kanban, ux, bugfix, scroll, avatar, board-filter]
dependency_graph:
  requires: []
  provides: [kanban-column-scroll, kanban-initials-avatars, kanban-board-title-resolution]
  affects: [kanban.astro, _kanban.css]
tech_stack:
  added: []
  patterns: [async-fetch-with-fallback, css-viewport-constraint, initials-avatar]
key_files:
  created: []
  modified:
    - apps/web/src/pages/kanban.astro
    - apps/web/src/styles/_kanban.css
decisions:
  - Initials-only avatar pills (no text label) — matches Teamhood/Jira/Linear pattern
  - Board-level tabindex removed — keyboard nav via individual card focus
  - Board titles resolved via async fetch from /api/boards with fallback to raw ID
  - Column scroll via CSS max-height + overflow-y (not virtual scroll) — sufficient for card counts
metrics:
  duration: ~15min
  completed: 2026-03-14
---

# Phase 6 Plan 01: Kanban P0 Bug Fixes Summary

**One-liner:** Fixed 4 critical Kanban UX bugs — initials-only avatar pills, removed board drag artifacts, resolved board group titles, and added column vertical scroll.

## Completed Tasks

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Fix user filter pills, board tabindex, board titles | `51e0e1b` | Removed name text from pills, removed board tabindex, async board title fetch |
| 2 | Add column vertical scroll constraints | `94aaa28` | max-height on board/column, overflow-y + min-height:0 on kanban-cards |

## What Changed

### Task 1: kanban.astro (3 fixes)
- **User filter pills**: Removed `<span>` element that rendered full `display_name`. Initials avatar circle + `title` tooltip is sufficient.
- **Board tabindex**: Removed `board.setAttribute("tabindex", "0")` which made the entire board draggable/focusable, causing ghost image artifacts.
- **Board title resolution**: Converted group-by handler to `async`, fetches board titles from `/api/boards` when `mode === "board"`, builds `boardTitleMap` lookup. Swimlane headers now show `📋 Board Name` instead of raw `board_id` strings like "default67".

### Task 2: _kanban.css (4 properties)
- `.kanban-board`: `max-height: calc(100vh - 200px)` — viewport-constrained
- `.kanban-column`: `max-height: 100%` — inherits board constraint
- `.kanban-column-header`: `flex-shrink: 0` — header stays pinned during scroll
- `.kanban-cards`: `overflow-y: auto` + `min-height: 0` — vertical scroll enabled

## Verification

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Pass — built in 5.20s |
| `pnpm --filter @meitheal/tests test` | ✅ 285 passed, 1 pre-existing failure (sw.js version sync), 0 regressions |
| Grep: no full name label | ✅ Not found |
| Grep: no board tabindex | ✅ Not found |
| Grep: boardTitleMap present | ✅ 4 occurrences |
| Grep: overflow-y auto | ✅ Present on kanban-cards |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All files exist, all commits verified:
- `51e0e1b`: kanban.astro JS fixes ✅
- `94aaa28`: _kanban.css scroll constraints ✅
