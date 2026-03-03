# Phase 55: Tasks & Table UX Overhaul - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

## Phase Boundary

Improve user journey, clean up UI/UX, and refactor shared code for the Tasks (list) and Table (spreadsheet) pages. Address P0-P2 findings from the 50-persona panel review. This phase delivers polished, consistent, accessible task views that feel premium inside Home Assistant.

## Implementation Decisions

### Filter & Sort Consistency
- Both pages must have **identical filter sets**: search, status, priority, RICE, and sort order
- Filter state must persist to `localStorage` with a **shared key** so switching views preserves context
- Every filter bar gets a **"Clear All" button** for quick reset
- Filters animate items smoothly (opacity transition, not `display:none` jump)

### RICE Badge Thresholds
- **Canonical thresholds aligned to filter values**: ≥15 high, ≥8 medium, <8 low
- Badge component (`RiceBadge.astro`) updated to match these thresholds
- Updates from current ≥50/≥20/<20 which were wrong

### Data Loading & Code Organization
- Extract shared `getTasksForView()` function into `@lib/task-queries.ts`
- Centralizes SQL query, RICE calculation, JSON field parsing, and overdue computation
- Both pages import from this shared utility — eliminates duplicated logic

### Visual Design
- **Remove all inline `style=""` attributes** — move to CSS classes using design tokens
- **Remove duplicated scoped CSS** that already exists in `global.css` (`@layer components`)
- Replace hardcoded hex priority colors with CSS custom properties
- Replace Unicode emoji icons (×, ⧉, 🗑) with consistent CSS-based icon patterns
- Action buttons on task list items **reveal on hover**, not always visible

### Accessibility
- Task items in list view get `role="button"`, `tabindex="0"` for keyboard navigation
- Table `contenteditable` cells get `role="textbox"` 
- Touch targets expanded to ≥44px for HA mobile panels

### Table-Specific Improvements
- Fix numeric sort for priority and RICE columns (was using string `localeCompare`)
- Revert `contenteditable` cells to original value when user clears and blurs
- Row click opens task detail panel (same as list view)
- Responsive: hide lower-priority columns (custom fields, calendar) on narrow viewports

### UX Enhancements
- Task count summary bar: "12 tasks · 3 active · 2 overdue"
- Overdue visual indicator on due dates (red highlight for past-due tasks)
- Fix duplicate task handler: use page reload instead of broken DOM clone
- Fix hardcoded English strings → i18n keys

### Claude's Discretion
- Exact CSS animation timing and easing for filter transitions
- Column hide breakpoints for responsive table
- Exact overdue styling (red text, badge, or background tint)
- How to structure the shared filter state localStorage key

## Specific Ideas

- Task count summary should mirror dashboard stat cards style but inline — not full card widgets
- Overdue indicator should match the `dashboard.overdue_label` pattern already defined
- The "Clear All" filter button should be a ghost/link button, not primary
- Table column sorting indicator (↑/↓) should use accent color (already does in CSS)

## Deferred Ideas

- Keyboard shortcuts for task navigation (J/K, X, E) — future phase
- Drag-to-reorder in list view — future phase  
- Parent/child task hierarchy rendering — future phase
- Favorites star toggle — future phase
- Task color field usage — future phase
- Pagination / virtual scrolling for 100+ tasks — future phase
- Print stylesheet — future phase
- Full-text search across description/labels — future phase
- Completion celebration micro-interaction — future phase

---

*Phase: 55-tasks-table-ux-overhaul*
*Context gathered: 2026-03-03*
