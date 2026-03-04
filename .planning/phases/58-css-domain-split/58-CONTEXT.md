# Phase 58: CSS Domain Split

**Goal:** Split the monolithic `global.css` (2271 lines) into domain-scoped CSS partials following DDD bounded context principles.

## Problem Statement

`apps/web/src/styles/global.css` contains ALL design tokens, resets, layout, and component styles in a single 2271-line file. This violates DDD bounded context separation and makes the styling system:
- Hard to navigate (no domain boundaries)
- Hard to modify without cross-domain regressions
- Hard to onboard new contributors
- Inconsistent with `apps/web/src/domains/` code-level DDD

## Scope

### In Scope
- Extract domain-scoped CSS into `_partial.css` files
- Keep `global.css` as a lean hub file (~15 lines of `@import` directives)
- Maintain Tailwind `@layer base/components/utilities` across partials
- Update STACK.md, ARCHITECTURE.md, STRUCTURE.md, STATE.md
- Zero visual regressions

### Out of Scope
- Moving styles to Astro `<style>` scoped blocks (shared classes like `.btn`, `.card` span multiple pages)
- Introducing CSS-in-JS or CSS modules
- Tailwind config changes
- Color palette changes

## Decisions (LOCKED)

| Decision | Rationale |
|----------|-----------|
| CSS `@import` partials, not Astro `<style>` | Shared classes (.btn, .card, .form-input) used across all pages |
| `_` prefix naming convention | Signals "not standalone" — same as Sass convention |
| 14 partials | Maps to domain/concern boundaries identified in audit |
| Keep `@layer` structure | Tailwind specificity ordering must be preserved |
| `@tailwind` directives stay in hub `global.css` | Must be first — imports follow |

## Claude's Discretion

- Exact line boundaries between partials (logical grouping over rigid line ranges)
- Whether to consolidate duplicate `.btn` definitions (L474 vs L1366)
- Whether filter-bar/priority classes go in `_tasks.css` or `_table.css`

## Deferred Ideas

- Component-level style extraction to Astro `<style>` blocks (future phase)
- Splitting `_responsive.css` into per-domain media queries (too fragmented)

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/styles/global.css` | Replace 2271 lines with ~15 `@import` lines |
| `apps/web/src/styles/_tokens.css` | NEW — design tokens, theme vars |
| `apps/web/src/styles/_base.css` | NEW — resets, typography, scrollbar |
| `apps/web/src/styles/_layout.css` | NEW — sidebar, main-content, topbar |
| `apps/web/src/styles/_forms.css` | NEW — form inputs, selects, labels |
| `apps/web/src/styles/_buttons.css` | NEW — btn variants |
| `apps/web/src/styles/_cards.css` | NEW — card, badges, status |
| `apps/web/src/styles/_tasks.css` | NEW — task items, bento grid, checklist |
| `apps/web/src/styles/_kanban.css` | NEW — kanban board, drag-drop, lanes |
| `apps/web/src/styles/_table.css` | NEW — data-table, inline-select, filter |
| `apps/web/src/styles/_feedback.css` | NEW — toast, skeleton, empty states |
| `apps/web/src/styles/_search.css` | NEW — search input/results |
| `apps/web/src/styles/_modal.css` | NEW — modal overlay, dialog |
| `apps/web/src/styles/_responsive.css` | NEW — media queries, print, touch |
| `apps/web/src/styles/_utilities.css` | NEW — a11y, transitions, animations |
| `.planning/codebase/STACK.md` | Add CSS Architecture section |
| `.planning/codebase/ARCHITECTURE.md` | Add Styling Architecture section |
| `.planning/codebase/STRUCTURE.md` | Expand styles/ directory listing |
| `.planning/STATE.md` | Bump version, add Phase 58 |
