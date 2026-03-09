---
phase: 3
plan: 1
subsystem: ui-ux
tags: [scroll-fix, theme-consistency, a11y, pwa, keyboard-shortcuts]
dependency-graph:
  requires: []
  provides: [scroll-fix, theme-explicit, body-overflow-cleanup, cmd-k-shortcut, a11y-aria-labels]
  affects: [all-pages, kanban, layout, settings]
tech-stack:
  added: []
  patterns: [body-scroll-model, explicit-theme-attribute, centralized-overlay-cleanup]
key-files:
  created: []
  modified:
    - apps/web/src/styles/_layout.css
    - apps/web/src/styles/_tokens.css
    - apps/web/src/lib/layout-controller.ts
    - apps/web/src/lib/task-modal-controller.ts
    - apps/web/src/layouts/Layout.astro
    - apps/web/src/pages/kanban.astro
decisions:
  - Body scrolling model changed from .main-content scroll to body natural scroll
  - All themes now set data-theme attribute explicitly including dark
  - Duplicate inline SW registration removed in favor of module import
metrics:
  duration: 15min
  completed: 2026-03-09
---

# Phase 3 Plan 1: UI/UX Stabilization Summary

Fixed 7 UI/UX regressions identified by 50-persona audit: scroll blocking, body overflow stuck, theme inconsistency, duplicate SW registration, missing Cmd+K shortcut, missing a11y labels, and loading bar motion safety.

## Commits

| Hash | Description |
|------|-------------|
| `9637e10` | fix(03-01): UI/UX stabilization — scroll, theme, overlay, a11y |

## Changes Made

### P0: Scroll Blocking (Fixed)
- **Root cause**: `.main-content` had `height: 100vh` + `overflow-y: auto`, creating a nested scroll context. Mouse wheel events targeted `body` but scrollable element was `.main-content`.
- **Fix**: Changed to `min-height: 100vh` with only `overflow-x: hidden`. Body now handles natural scrolling.

### P0: Body Overflow Stuck (Fixed)
- **Root cause**: Opening task detail set `body.style.overflow = 'hidden'`, but Escape key close path didn't reset it. Only `pagehide` event did.
- **Fix**: Added `body.style.overflow = ''` in both `closeTD()` (task-modal-controller) and Escape key handler (layout-controller).

### P1: Theme Init (Fixed)
- **Root cause**: Dark theme relied on `:root` fallthrough — no `data-theme="dark"` attribute was set. Components using `[data-theme="dark"]` selector got nothing.
- **Fix**: Theme init now always calls `setAttribute("data-theme", t)` for all theme values including dark.

### P1: Duplicate SW Registration (Fixed)
- Removed 46-line inline SW registration block (L1283-1332). Module import version at end of body retained.

### P2: Cmd+K (Added)
- `Ctrl+K` / `Cmd+K` now toggles command palette overlay and focuses the input.

### P2: A11y Labels (Added)
- Kanban card action buttons (edit ✏️, AI 🤖, duplicate ⧉) now have `aria-label` with task title context.

### P2: Reduced Motion (Added)
- Loading bar animation suppressed via `@media (prefers-reduced-motion: reduce)`.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- **Test suite**: 285 passed, 1 pre-existing failure (sw.js version mismatch — not caused by this change), 65 skipped
- **No regressions introduced**
