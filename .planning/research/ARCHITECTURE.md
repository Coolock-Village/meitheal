# Architecture Patterns — List View Overhaul

**Domain:** Task management list/table views
**Researched:** 2026-03-14

## Current Architecture (Problems)

### Duplicated Filter Systems

```
table.astro                          kanban.astro
├─ filter-bar (HTML selects)         ├─ type-toolbar (button toggles)
├─ LabelFilterBar component          ├─ user-filter pills (dynamic)
├─ table-controller.ts               ├─ board-filter (select)
│  └─ applyTableFilters()            ├─ group-by-select (select)
│  └─ filter-state.ts                ├─ LabelFilterBar component
│                                    └─ Inline script (~800 lines)
│                                       └─ 4 separate filter handlers
```

**Problems:**
- 6 filter bugs in kanban (documented in 06-07-RESEARCH.md)
- Table missing 3 filter dimensions (type, board, group-by)
- Filter state partially shared (localStorage key), but UI is completely separate
- No unified "is this task visible" function

### No Grouping in Table

Table renders a flat `<tbody>` with subtask tree hierarchy. No concept of
collapsible group sections for status/priority/type/assignee grouping.

## Recommended Architecture

### Shared Filter Toolbar Component

```
FilterToolbar.astro (shared)
├─ Props: { view: 'kanban' | 'table', showGroupBy: boolean }
├─ Type filter buttons (epic/story/task toggles)
├─ User filter pills (dynamic from data)  
├─ Board filter select
├─ Label filter (LabelFilterBar)
├─ Search input
├─ Status filter
├─ Priority filter
├─ RICE filter
├─ Group-by select
├─ Clear all button
└─ Emits: meitheal:filter-change CustomEvent
```

**One toolbar, two consumers.** Kanban and Table both import `FilterToolbar.astro` and listen to the same `meitheal:filter-change` event. Each view applies visibility in its own way (kanban hides cards, table hides rows or regroups).

### Table Grouping Model

```
<table>
  <thead>...</thead>
  <tbody>
    <!-- Group: Epic -->
    <tr class="group-header" data-group="epic">
      <td colspan="13">
        <button class="group-toggle">▾</button>
        <span class="group-dot" style="bg: purple"></span>
        🎯 Epic <span class="group-count">5</span>
      </td>
    </tr>
    <tr class="group-row" data-group="epic">...</tr>
    <tr class="group-row" data-group="epic">...</tr>
    
    <!-- Group: Story -->
    <tr class="group-header" data-group="story">
      <td colspan="13">...</td>
    </tr>
    <tr class="group-row" data-group="story">...</tr>
  </tbody>
</table>
```

**Server-side grouping** in Astro frontmatter (group tasks by selected dimension), **client-side regrouping** when group-by changes (DOM manipulation in controller).

### Unified Filter State

```typescript
// filter-state.ts (extended)
export interface FilterState {
  search: string
  status: string
  priority: string
  rice: string
  sort: string
  user: string
  // NEW dimensions
  board: string        // board filter
  types: string[]      // active type filters (multi-select)
  groupBy: string      // none | type | priority | board | assignee | status
  labels: string[]     // active label filters
}
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `FilterToolbar.astro` | Renders all filter UI, emits events | filter-state.ts |
| `filter-state.ts` | Persists/loads all filter dimensions | localStorage, URL params |
| `table-controller.ts` | Applies filters to table rows, manages grouping | FilterToolbar events |
| kanban inline script | Applies filters to cards, manages swimlanes | FilterToolbar events |
| `LabelFilterBar.astro` | Renders label chips (absorbed into FilterToolbar) | FilterToolbar |

### Data Flow

```
User clicks filter → FilterToolbar emits meitheal:filter-change
  → table-controller.ts receives event
    → applyTableFilters() hides/shows rows
    → If groupBy changed: regroupTableRows() rebuilds group sections
    → updateGroupCounts() refreshes badges
  → kanban controller receives event  
    → applies visibility to cards
    → updateAllCounts() refreshes column/swimlane badges
```

## Patterns to Follow

### Pattern 1: CustomEvent-Driven Filtering
**What:** All filter changes emit a single `meitheal:filter-change` CustomEvent with the full filter state.
**When:** Any filter interaction.
**Why:** Decouples filter UI from view-specific rendering. Already precedent with `meitheal:label-filter`.

### Pattern 2: Server-Side Initial Grouping + Client-Side Regroup
**What:** Astro frontmatter groups tasks for initial render. Client JS regroups on group-by change.
**When:** Table load and group-by changes.
**Why:** Fast initial load (no CLS), smooth UX for re-grouping without page reload.

### Pattern 3: CSS Class Visibility (not inline style)
**What:** Use `.filtered-out` CSS class instead of `style.display = "none"`.
**When:** All filter visibility toggling.
**Why:** Enables count selectors (`:not(.filtered-out)`) without fragile style parsing. Already identified as fix in 06-07-RESEARCH.md.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Inline Style Visibility
**What:** Using `el.style.display = "none"` for filter visibility.
**Why bad:** Count functions need `[style*="display: none"]` which is fragile and misses CSS class-based hiding. Root cause of 6 kanban bugs.
**Instead:** Use CSS classes like `.filtered-out { display: none }`.

### Anti-Pattern 2: Separate Filter Handlers Per Dimension
**What:** Each filter dimension (type/user/board/label) has its own handler that independently applies visibility.
**Why bad:** Filters don't compose — applying user filter doesn't respect active type filter.
**Instead:** Single `applyAllFilters()` function that evaluates ALL dimensions on every change.

### Anti-Pattern 3: Page Reload for Grouping
**What:** Changing group-by reloads the page with a query param.
**Why bad:** Slow, loses scroll position, loses filter state.
**Instead:** Client-side DOM regrouping within the existing table.
