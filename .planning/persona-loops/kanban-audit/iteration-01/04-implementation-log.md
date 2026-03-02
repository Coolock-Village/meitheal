# 04 — Implementation Log

## Changes Made

### `kanban.astro` — 11 modifications

1. **+New Task → modal** — `openNewTaskModal()` replaces inline add trigger
2. **Column collapse removed** — T-1915 handler + CSS deleted (33 lines removed)
3. **Drag ghost removed** — `ondragover` simplified to `classList.add('drag-over')`
4. **CSS drop indicator** — `::after` pseudo-element on `.kanban-column.drag-over .kanban-cards`
5. **Column border** — `border: 2px solid transparent` prevents layout shift on drag-over
6. **Column sizing** — `flex: 1; min-width: 280px` replaces fixed 320px width
7. **Duplicate `+` fix** — Removed extra `+` prefix from `kanban-add-btn` template
8. **Filter alignment** — `type-toolbar` padding changed to `8px 0` to inherit parent padding
9. **Edit button retry** — Polls `openTaskDetail` 10 times at 50ms intervals instead of fallback redirect
10. **Contextual toast** — Toast positioned via `getBoundingClientRect()` near the dropped card
11. **Column padding** — `padding: 12px` for consistent internal spacing

### `Layout.astro` — 1 modification

12. **Keyboard hint dismiss** — `localStorage.setItem` added to `setTimeout` callback (8s auto-dismiss)

## Build Status
- `pnpm build` — ✅ 0 errors, 0 warnings (just 1 CSS minify note about `calc()`)
