# Domain Pitfalls — List View Overhaul

**Domain:** Task management list/table views
**Researched:** 2026-03-14

## Critical Pitfalls

### Pitfall 1: Importing Kanban Filter Bugs Into Shared Component
**What goes wrong:** Extracting a shared FilterToolbar without first fixing the 6 known kanban bugs (06-07-RESEARCH) means the table inherits broken filter composability.
**Why it happens:** Temptation to "unify first, fix later" to avoid duplicate work.
**Consequences:** Table view ships with broken filter interactions. Both views have bugs instead of one.
**Prevention:** Fix kanban filter bugs FIRST (Plan 06-07), THEN extract shared component.
**Detection:** Swimlane counts don't update when filters change, cards visible that should be hidden.

### Pitfall 2: Grouping + Subtask Tree Interaction
**What goes wrong:** Table already has a parent/child tree (subtask hierarchy). Adding group-by creates conflicts — does a child task belong in its parent's group or its own status group?
**Why it happens:** Subtask tree and group-by are both row-organization features that can conflict.
**Consequences:** Tasks appear in wrong groups, subtree expand/collapse breaks, child tasks orphaned from parents.
**Prevention:** When group-by is active, flatten the tree (no subtask indentation). When group-by is "none", show the existing tree. These are mutually exclusive modes.
**Detection:** Subtask rows appearing under wrong group headers, expand/collapse toggles non-functional within groups.

### Pitfall 3: Client-Side Regrouping Performance
**What goes wrong:** With 500+ tasks, client-side DOM regrouping (removing/re-inserting all `<tr>` elements) causes visible layout shift and jank.
**Why it happens:** DOM manipulation is expensive. Moving hundreds of rows triggers layout recalculation.
**Consequences:** Sluggish group-by switching, visible flicker, scroll position lost.
**Prevention:** Use `documentFragment` for batch operations, debounce rapid group-by changes, consider virtual scrolling for 1000+ tasks (defer).
**Detection:** Noticeable delay (>200ms) when changing group-by with 200+ rows.

## Moderate Pitfalls

### Pitfall 4: Group Collapse State vs Filter State Interaction
**What goes wrong:** User collapses a group, then applies a filter that hides all remaining visible items in another group. The collapsed group appears empty but actually has matching items.
**Prevention:** When filters change, update group counts BEFORE checking collapse. Show groups with 0 visible items as fully collapsed with a "(0)" count badge.

### Pitfall 5: URL Sync Complexity
**What goes wrong:** Adding board/type/groupBy to URL params creates long, ugly URLs that break when shared between views (kanban doesn't need sort param, table doesn't need groupBy param for the same meaning).
**Prevention:** Namespace URL params by view (`tbl_group`, `tbl_board` vs `kb_group`). Or use a single `view` param that encodes the preset.

### Pitfall 6: Mobile/HA Ingress Toolbar Overflow
**What goes wrong:** Adding type toggles, user pills, board selector, and group-by to the table toolbar creates horizontal overflow in narrow HA ingress iframes.
**Prevention:** Use a "More filters" dropdown/popover for secondary filters. Keep only search + status + priority visible at small widths. Use CSS container queries.

## Minor Pitfalls

### Pitfall 7: Accessibility of Group Headers
**What goes wrong:** Group headers are `<tr>` elements with colspan, but assistive tech treats them as data rows.
**Prevention:** Use `role="rowgroup"` and `aria-expanded` on group headers. Ensure keyboard navigation works for expand/collapse.

### Pitfall 8: Empty Groups
**What goes wrong:** When all tasks in a group are filtered out, users see an empty group header with "0" count.
**Prevention:** Auto-hide groups with zero visible tasks. Show them when filter is cleared.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Shared FilterToolbar | Kanban inline script coupling | Extract toolbar as Astro component, kanban script listens to events |
| Table grouping | Subtask tree conflict | Mutually exclusive modes (tree vs group) |
| Client-side regroup | Performance with 500+ tasks | DocumentFragment batch, defer virtual scroll |
| URL persistence | View-specific params collide | Namespace by view prefix |
| Saved presets | Schema migration needed | Use existing `/api/saved-filters` with extended schema |
