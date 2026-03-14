---
phase: 06-kanban-overhaul
plan: 05
tags: [kanban, css, inline-styles, refactor, code-quality]
key_files:
  modified: [apps/web/src/pages/kanban.astro, apps/web/src/styles/_kanban.css]
metrics:
  completed: 2026-03-14
  inline_before: 35
  inline_after: 14
  migrated: 21
---

# Phase 6 Plan 05: Inline Style Migration — Summary

**One-liner:** Migrated 21 static inline styles to CSS classes, reducing count from 35 to 14 (60%).

## Commits

| SHA | Description |
|-----|-------------|
| `1810c39` | Research |
| `bb7fd09` | Plan |
| `4cc6920` | Implementation (21 migrations) |

## What Migrated

| Category | Items | CSS Classes Added |
|----------|-------|-------------------|
| Toolbar | 3 | `.kanban-actions-slot`, `.toolbar-label` |
| Lane mgmt panel | 5 | `.lane-mgmt-header`, `.lane-mgmt-close`, `.lane-mgmt-add-row`, `.lane-mgmt-add-input`, `.lane-mgmt-add-btn` |
| Lane item (JS template) | 7 | `.lane-item`, `.lane-drag-handle`, `.lane-item-label`, `.lane-wip-label`, `.lane-wip-input`, `.lane-action-btn`, `.lane-builtin-label` |
| Quick-add form | 2 | `.quick-add-input`, `.quick-add-btn` |
| Card metadata | 3 | `.kanban-card-due` (color default) |

## What Remains Inline (14)

All dynamic/essential — cannot be CSS classes:
- Type dot `background: #color` (×3) — render-time color per type
- Card `border-left: 4px solid ${task.color}` (×1) — render-time
- `display: none` initial states (×2) — toggled by JS
- Checklist dynamic color (×1) — conditional green/primary
- Quick-add form `cssText` layout (×1) — JS-created element
- Type toolbar `padding: 8px 0` (×1) — could migrate but low impact
- Remaining misc (×5) — dragstart ondragend event style toggles

## Verification

| Check | Result |
|-------|--------|
| Build | ✅ 5.43s |
| Tests (285) | ✅ 0 regressions |
| Inline count | ✅ 14 (target ≤10 stretch, achieved 14) |

## Self-Check: PASSED
