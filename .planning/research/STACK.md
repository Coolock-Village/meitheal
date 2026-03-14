# Technology Stack — List View Overhaul

**Project:** Meitheal List View Overhaul
**Researched:** 2026-03-14

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Astro | 5.x (current) | SSR rendering, component model | Already in use, Astro-native constraint |
| TypeScript | 5.x (current) | Controller logic | Already in use |
| Vanilla CSS | N/A | Styling with `@layer components` | Already in use, DDD CSS ownership |

### No New Dependencies

This feature is achievable entirely within the existing stack:
- **Grouping:** Server-side in Astro frontmatter + client-side DOM manipulation
- **Filtering:** Extends existing `filter-state.ts` module
- **Toolbar:** Astro component composition (no new UI library needed)
- **Persistence:** Existing `/api/saved-filters` endpoint + SQLite via Drizzle

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Grouping | Server + client hybrid | Pure client-side | Slow initial render, CLS issues |
| Grouping | Server + client hybrid | Server-only (page reload) | Terrible UX, loses scroll/filter state |
| Virtual scroll | Defer | TanStack Virtual | Only needed at 1000+ tasks, adds dependency |
| Filter UI | Astro component | React island | Over-engineering, breaks Astro-first principle |
| State mgmt | CustomEvent + localStorage | Nano Stores | Extra dependency for simple state |

## Installation

```bash
# No new packages needed
```

## File Changes Summary

| File | Action |
|------|--------|
| `components/ui/FilterToolbar.astro` | NEW — shared filter UI component |
| `lib/filter-state.ts` | MODIFY — extend with board/type/groupBy/labels |
| `pages/table.astro` | MODIFY — add grouping, use FilterToolbar |
| `lib/table-controller.ts` | MODIFY — add grouping logic, unified filter handlers |
| `styles/_table.css` | MODIFY — add group header styles |
| `pages/kanban.astro` | MODIFY — use FilterToolbar, remove inline filter HTML |
| `pages/api/saved-filters.ts` | MODIFY — extend schema for new dimensions |
