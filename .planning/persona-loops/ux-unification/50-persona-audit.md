# 50-Persona Audit — UX Consistency & Filter Unification

**Scope:** Status model unification, filter/sort parity across views, dashboard actionability, board filter integration, user/assignee filter UX, kanban in-lane reorder, and overall ADHD-friendly UX.

**Date:** 2026-03-07

---

## Category 1: Status Model & Schema (5 personas)

### 1. Data Architect
**Finding:** The `tasks.status` column stores 6 different string values: `todo`, `pending`, `active`, `in_progress`, `complete`, `done`. There's no single source of truth — each view handles mapping independently. Schema has no CHECK constraint.
**Action:** Define canonical statuses: `backlog`, `pending`, `active`, `complete`. Map all aliases in a single shared `status-model.ts` module. Add CHECK constraint in next migration.
- I:5 | E:4 | R:3

### 2. Domain Model Analyst
**Finding:** Kanban swimlanes are driven by `kanban_lanes.includes[]` arrays (e.g. `["pending","todo"]`), while table/list views hardcode status values in filter dropdowns. The two systems have no shared vocabulary. `backlog` exists in kanban but not in the table/list status filter.
**Action:** Create `STATUS_CONFIG` constant (canonical status → lane mapping, label, icon, color) used by every view. Deprecate per-view hardcoded lists.
- I:5 | E:3 | R:2

### 3. Consistency Auditor
**Finding:** Today page sends `PATCH` with `{ status: "done" }`, tasks page sends `PUT` with `{ status: "complete" }`, kanban sends `PUT` with `{ status: col.key }`. Three different HTTP methods and status values for the same operation.
**Action:** Standardize on `PUT /api/tasks/:id` with canonical status values. The API should normalize aliases on write (accept `done`→`complete`, `in_progress`→`active`, `todo`→`pending`).
- I:4 | E:3 | R:2

### 4. API Contract Reviewer
**Finding:** The API accepts arbitrary status strings without validation. A task can be saved with status `"banana"`. No Zod/validation schema on the status field.
**Action:** Add Zod enum validation in the PUT/PATCH handlers. Accept canonical + aliases, reject unknowns.
- I:4 | E:2 | R:1

### 5. HA Entity Status Mapper
**Finding:** The HA custom component maps Meitheal statuses to HA todo entity states (`needs_action`, `completed`). The 6-value chaos makes this brittle. The `todo-status-mapper.ts` bridge already exists but maps a superset.
**Action:** Ensure `todo-status-mapper.ts` consumes the canonical `STATUS_CONFIG` rather than independently mapping strings.
- I:3 | E:2 | R:1

---

## Category 2: Dashboard Stat Cards (5 personas)

### 6. Product Manager (ADHD)
**Finding:** "68 TOTAL TASKS" is not actionable. Nobody wakes up caring about total task count. "68 OPEN" (non-completed) would drive action. Total is only fun for export/reporting.
**Action:** Replace "Total Tasks" stat with "Open Tasks" (count of non-completed). Add total to settings/export/reporting only.
- I:5 | E:1 | R:1

### 7. Interaction Designer
**Finding:** Stat cards for "Active" and "Overdue" are `<div>`s with anchor-link targets (`#stat-active`, `#stat-overdue`) in the greeting text, but the stat cards themselves are **not clickable**. Clicking "5 OVERDUE" should navigate to a filtered view showing overdue tasks.
**Action:** Make stat cards clickable links: Active → `/tasks?status=active`, Overdue → `/tasks?status=overdue`, Open → `/tasks`, Completed → `/tasks?status=complete`. Add `cursor: pointer` hover states.
- I:5 | E:2 | R:1

### 8. Visual Feedback Specialist
**Finding:** Stat card hover states exist in CSS but cards aren't interactive. Users hover expecting something to happen (especially on the red Overdue card). This violates the principle of perceived affordance.
**Action:** Wrap stat cards in `<a>` tags. Add hover elevation + glow matching the stat color. The overdue card red already has `stat-card-danger` — extend with hover interaction.
- I:4 | E:2 | R:1

### 9. Localization Reviewer
**Finding:** "My open tasks" title is hardcoded English, not using the i18n `t()` function. The subtitle "15 open tasks" is also not localized.
**Action:** Add `dashboard.my_tasks`, `dashboard.open_tasks_count` translation keys. Use `t()` for the section title and subtitle.
- I:3 | E:1 | R:1

### 10. Dashboard Section Naming Expert
**Finding:** "My open tasks" is confusing now that multi-user assignment exists. With an "All users" filter active, it shows everyone's tasks, not just "mine." The "My" prefix implies personal scope.
**Action:** Rename to "Open Tasks" or make "My" dynamically change to the selected user's name. When filtered: "Ryan's Tasks" / "Jess's Tasks" / "All Open Tasks".
- I:4 | E:2 | R:1

---

## Category 3: User/Assignee Filtering (5 personas)

### 11. ADHD UX Researcher
**Finding:** Dashboard user filter is a `<select>` dropdown tucked into a card header. On kanban, users are avatar pills with visual identity (initials + color). Two completely different interaction patterns for the same concept.
**Action:** Unify user filter to pill-based UI everywhere. Create a reusable `UserFilterPills.astro` component used by dashboard, kanban, table, and tasks views.
- I:5 | E:3 | R:2

### 12. Accessibility Expert
**Finding:** Kanban user filter pills have no keyboard navigation. The "∅" unassigned symbol has no aria-label. Dashboard `<select>` is accessible but doesn't visually communicate who's selected.
**Action:** Add `role="group"`, `aria-label`, keyboard navigation (arrow keys) to pill filters. Add proper labels for unassigned.
- I:3 | E:2 | R:1

### 13. Filter Consistency Auditor
**Finding:** Kanban has user filtering via pills. Table view has NO user filter. Tasks list has NO user filter. Today/Upcoming have NO user filter. Dashboard has a dropdown. Five different views, three different behaviors.
**Action:** Add user/assignee filter to table, tasks, and today/upcoming views. Use the shared `UserFilterPills.astro` component.
- I:5 | E:3 | R:2

### 14. Data Flow Analyst
**Finding:** Dashboard user filter fetches `/api/users` on every page load but caches nothing. Kanban also fetches `/api/users` independently. If you add a user on kanban, dashboard doesn't see it until reload.
**Action:** Create a shared `fetchUsers()` utility in `@lib/users.ts` with sessionStorage caching (5min TTL). All views consume this.
- I:3 | E:2 | R:1

### 15. Multi-Select UX Designer
**Finding:** Current user filter is single-select (one user OR all). For households, you might want "show Ryan + Jess but not Doug." The pill-based UI naturally supports multi-select with toggle states.
**Action:** Make user filter pills multi-toggle: click toggles individual users on/off. "All" resets to show everything. Multiple pills can be active simultaneously.
- I:4 | E:3 | R:2

---

## Category 4: Sort & Filter Parity (5 personas)

### 16. Feature Parity Auditor
**Current state by view:**

| Filter/Sort | Dashboard | Tasks/List | Kanban | Table | Today | Upcoming |
|------------|-----------|------------|--------|-------|-------|----------|
| Search | ✅ global | ✅ | ✅ (via global) | ✅ | ❌ | ❌ |
| Status | ❌ | ✅ | via lanes | ✅ | ❌ | ❌ |
| Priority | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| RICE | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Sort | ❌ | ✅ | ❌ | ✅ (column click) | ❌ | ❌ |
| User | ✅ (dropdown) | ❌ | ✅ (pills) | ❌ | ❌ | ❌ |
| Board | ✅ (sidebar) | ✅ (sidebar) | ✅ (sidebar) | ✅ (sidebar) | ❌ | ❌ |
| Custom Fields | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Action:** Create `UnifiedFilterBar.astro` shared component with: search, status, priority, user, board (multi-select), sort-by, RICE, custom field filter. Each view includes it with appropriate feature flags.
- I:5 | E:4 | R:3

### 17. Sort-by-Date Expert
**Finding:** Table has clickable column headers for sorting but `due_date` column sorting has no client-side sort comparator for dates. Tasks/list has `due_date-asc` in the sort dropdown but table doesn't have a date-sort button in the sort dropdown — it only has column click sorting.
**Action:** Add date comparator to table column sorting. Ensure both views support sort-by-due-date consistently.
- I:4 | E:2 | R:1

### 18. Board Filter Integration Architect
**Finding:** Board filter lives in the sidebar (`SidebarBoardSwitcher.astro`) completely disconnected from the filter bar. It's single-select only. The sidebar filter applies via `display: none` CSS — it doesn't update counts or interact with other filters. It's a powerful feature buried in the wrong place.
**Action:** Integrate board filter into the unified filter bar as a multi-select dropdown. Allow selecting 1+ boards, keep "All Boards" as default. Sidebar board switcher becomes a quick-access shortcut that syncs state with the filter bar.
- I:5 | E:4 | R:3

### 19. Custom Field Filter Designer
**Finding:** Tasks have a `custom_fields` JSON column. Custom fields render on kanban cards and table rows but there's NO way to filter by custom field values. You can see `Environment: Production` but can't filter to show only Production tasks.
**Action:** Add custom field filter dropdown to the unified filter bar. Detect available field keys from the task data, let user select a field and value.
- I:4 | E:3 | R:2

### 20. Filter State Persistence Analyst
**Finding:** Tasks/list and table share `meitheal-task-view-filters` localStorage key and sync to URL params. But kanban filters (type, user) use separate localStorage keys. Board filter uses `meitheal_active_board`. Three isolated filter stores for what should be one unified state.
**Action:** Create unified filter state manager. All filters persist to one localStorage key + URL params. When switching views via TaskViewTabs, filters carry over.
- I:4 | E:3 | R:2

---

## Category 5: Kanban UX (5 personas)

### 21. Kanban Power User
**Finding:** Cards can be dragged between lanes (status change) but there's NO way to reorder cards within the same lane. In a real kanban, position within a lane matters (priority visual). Every competitor (Trello, Linear, Jira) supports in-lane reorder.
**Action:** Add in-lane drag-drop reorder. Store task `position` (integer) per lane. Update DB schema with `kanban_position` column. Reorder via PUT API.
- I:5 | E:4 | R:3

### 22. Kanban Lane ↔ Status Unifier
**Finding:** Swimlanes should equal Status. Currently, swimlanes in kanban map to statuses via `kanban_lanes.includes[]`, but this mapping is opaque. Users configure lanes without understanding they're defining status groups. The concept needs unification.
**Action:** Make it explicit: each canonical status gets a default lane. Custom lanes can be created but must map to exactly one canonical status. Settings UI explains this clearly.
- I:5 | E:3 | R:2

### 23. Kanban Add-Task UX Analyst
**Finding:** The `+ Add task` button at the bottom of each column passes `data-status={col.key}` but the `NewTaskModal` doesn't pre-select a status when opened from a lane-specific button.
**Action:** Pass status as a parameter to `openNewTaskModal({ status: col.key })`. Pre-select the corresponding status in the modal.
- I:3 | E:2 | R:1

### 24. WIP Limit Communicator
**Finding:** WIP limits show as `n/max` in the lane header but there's no visual explanation of what WIP means. First-time users see `3/5` and have no context.
**Action:** Add tooltip on WIP badge: "Work-in-Progress limit: maximum X tasks recommended in this lane to prevent overload."
- I:2 | E:1 | R:1

### 25. Kanban Empty State Designer
**Finding:** Empty kanban column shows "Drop tasks here" — functional but not motivating. Competitors show encouraging empty states ("No tasks in progress — start something!" or "This lane is clear ✨").
**Action:** Context-aware empty states per lane: Backlog → "Nothing queued — add tasks when ready", Todo → "Drag tasks here to plan", Active → "Start working on something!", Done → "Complete tasks to see them here ✨".
- I:2 | E:1 | R:1

---

## Category 6: Dashboard Deep Links (5 personas)

### 26. Navigation Architect
**Finding:** Dashboard greeting shows "— 5 overdue" as a link pointing to `#stat-overdue` (same-page anchor). This scrolls to the stat card, NOT to a filtered view of overdue tasks. The stat card itself is just a div. Dead end.
**Action:** Change overdue link to navigate to `/tasks?overdue=true`. Change active link to `/tasks?status=active`. Make these real navigations.
- I:5 | E:2 | R:1

### 27. Information Scent Expert
**Finding:** The "Recent Tasks" section shows the last 10 tasks created. For a user with 68 tasks, this is random noise. A user coming to the dashboard wants to see: what needs attention NOW, not what was created last.
**Action:** Reorder dashboard: (1) Stat cards, (2) Quick Add, (3) Open/Overdue Tasks, (4) Favorites, (5) Recent (collapsed by default). "My open tasks" should be the primary content.
- I:4 | E:2 | R:1

### 28. Kanban Quick-Link Analyst
**Finding:** "My open tasks" card has a "Kanban →" link. This navigates to `/kanban` without carrying over the user filter state. If you filtered to "Ryan Winkler" and click Kanban, the kanban doesn't pre-filter.
**Action:** Pass user filter as URL param: `/kanban?user=ryan_winkler`. Kanban reads URL params on load.
- I:3 | E:2 | R:1

### 29. Task Count Accuracy Reviewer
**Finding:** The "My open tasks" subtitle shows "15 open tasks" but this count changes client-side when the user filter is applied. The server-rendered count is for ALL users. This causes a flash of incorrect count.
**Action:** Server-render the count as the initial total, then update client-side after filter applies. Add a loading shimmer during the transition.
- I:2 | E:1 | R:1

### 30. Quick Add Board Awareness
**Finding:** Quick-add on dashboard creates tasks on the active board (from sidebar). But there's no visual indicator of WHICH board the task will land on. User might not realize they have "Work" selected in the sidebar while quick-adding a personal task.
**Action:** Show small board badge next to quick-add input: "Adding to: 📋 Default" or "Adding to: 💼 Work". Updates when sidebar board changes.
- I:3 | E:2 | R:1

---

## Category 7: Today/Upcoming UX (5 personas)

### 31. Today Page Functionality Reviewer
**Finding:** Today page has no filters at all. No search, no priority filter, no user filter, no board filter. For a household with multiple users, you see everyone's tasks with no way to focus.
**Action:** Add the unified filter bar (user, priority, board at minimum). Date filter not needed here (Today is the filter).
- I:4 | E:2 | R:1

### 32. Upcoming Page Analysis
**Finding:** Upcoming page likely has the same filter gap as Today. Need to verify and add filters.
**Action:** Add unified filters to upcoming view. Include date range selector for "next 7 days" / "next 14 days" / "next 30 days".
- I:3 | E:2 | R:1

### 33. Today/Upcoming Priority Inversion
**Finding:** Today page priority labels are inverted: `1: "Lowest"` through `5: "Highest"`. But everywhere else: `1: "Critical"` through `5: "Minimal"`. Priority 1 = most important everywhere except Today where it's "Lowest."
**Action:** Fix priority labels on Today page to match the canonical mapping (1=Critical, 5=Minimal). This is a bug.
- I:5 | E:1 | R:1

### 34. Today/Upcoming Status Badge Gap
**Finding:** Today/Upcoming pages don't show status badges. Tasks just have priority dots and titles. On tasks/list and table, every task shows its status badge. Inconsistent.
**Action:** Add `StatusBadge` component to Today/Upcoming task items.
- I:3 | E:1 | R:1

### 35. Today Quick-Add Integration
**Finding:** Today page has its own quick-add form with NL date parsing feedback. This is great UX but it's completely independent of the dashboard quick-add and the `NewTaskModal`. Three task creation flows, all with different capabilities.
**Action:** Consolidate: make `NewTaskModal` the primary creation flow. Quick-add on dashboard and Today should be simple text → API shortcuts that feed into the same creation pipeline.
- I:3 | E:2 | R:2

---

## Category 8: Shared Component Architecture (5 personas)

### 36. Component Reuse Auditor
**Finding:** Priority color mapping is duplicated across 6 files: `index.astro`, `kanban.astro`, `today.astro`, `upcoming.astro`, `table.astro`, `tasks.astro`. Each with slightly different color values (today uses `#6366F1` for p=4, kanban uses `#6366F1`, index uses `#22c55e`).
**Action:** Create `@lib/priority-config.ts` with a single `PRIORITY_CONFIG` export: label, color, dot color, CSS class for each level. All views import from this.
- I:5 | E:2 | R:1

### 37. Status Label Deduplication Expert
**Finding:** Status label maps are duplicated in `index.astro` (4 entries), `kanban.astro` (implicit via lane labels), `table.astro` (3 options), `tasks.astro` (3 options). The i18n keys exist (`task_status.pending`, etc.) but the mapping objects are rebuilt per page.
**Action:** Create `@lib/status-config.ts` with canonical status definitions. All views consume this through `t()` + config.
- I:4 | E:2 | R:1

### 38. Task Item Component Architect
**Finding:** Task item rendering is different across dashboard (minimal — title + due date), tasks/list (full — checkbox, favorite, status badge, RICE, labels), today (compact — checkbox, priority dot, title), kanban (card — priority, type badge, description, meta). Four different templates for the same data.
**Action:** Don't over-unify — each view's task display is legitimately different. But extract shared sub-components: `TaskPriorityDot`, `TaskDueDate`, `TaskAssigneeBadge` that each view composes.
- I:3 | E:2 | R:2

### 39. Filter State URL Sync Evaluator
**Finding:** Tasks and table sync filters to URL params for deep-linking. Kanban doesn't. Today/Upcoming don't. Dashboard doesn't. Only 2 of 6 views support shareable filtered URLs.
**Action:** All views with filters should sync to URL params. This enables deep-linking from notifications, dashboard stat cards, and shared links.
- I:4 | E:2 | R:1

### 40. Sort Direction Indicator
**Finding:** Table has sortable column headers but no visual indicator of which column is sorted and in which direction. Users click a column and can't tell if it's ASC or DESC.
**Action:** Add sort arrow indicators (▲/▼) to the active sort column header. Toggle direction on repeated clicks.
- I:3 | E:2 | R:1

---

## Category 9: ADHD-Specific Optimizations (5 personas)

### 41. Cognitive Load Reducer
**Finding:** The dashboard presents: 4 stat cards + quick add + favorites + my open tasks + recent tasks. That's 7 distinct information blocks. For ADHD users, this is overwhelming. The eye bounces between sections.
**Action:** Establish clear visual hierarchy: stat cards (glanceable), then ONE primary action section (open tasks), then secondary sections collapsed behind accordions.
- I:4 | E:2 | R:1

### 42. Context Switching Reducer
**Finding:** Switching between List, Kanban, Table views resets filter state in some cases. A user who filters to "Active" on the list, then switches to Kanban, loses their filter. TaskViewTabs passes query params but kanban ignores URL params for status.
**Action:** Ensure all views read `?status=active` from URL params on load and pre-filter accordingly. TaskViewTabs already forwards params — the receiving views just need to read them.
- I:5 | E:2 | R:1

### 43. Visual Anchor Specialist
**Finding:** On the kanban board, there's no visual indicator of which card you last interacted with. After a drag operation, the card lands in the new column but there's no highlight/pulse to confirm the move visually.
**Action:** After a successful drag-drop, pulse the moved card with a subtle animation (border glow → fade). CSS-only, 600ms duration.
- I:3 | E:1 | R:1

### 44. Overdue Task Urgency Designer
**Finding:** Overdue tasks on Today page show the due date in red. But on the dashboard "My open tasks", overdue is shown as text "Overdue by 1 day" in muted color. The urgency signal is inconsistent.
**Action:** Standardize overdue display: always show red indicator, relative time ("Overdue by 1 day"), and optionally the absolute date. The `relativeTime()` helper already exists — extend it with danger styling.
- I:3 | E:1 | R:1

### 45. Focus Mode Advocate
**Finding:** No way to temporarily hide everything except the current focus. An ADHD user wants to see ONLY their active tasks, nothing else. The filter bar helps but the stat cards, quick add, and chrome are still visible.
**Action:** Defer to a future "Focus Mode" feature. For now, ensure the filter bar adequately hides non-matching content and the view feels clean when filtered.
- I:2 | E:0 | R:0 | **DEFER**

---

## Category 10: Technical Foundation (5 personas)

### 46. Migration Safety Reviewer
**Finding:** Adding `kanban_position` column and `status` CHECK constraint requires a new Drizzle migration. SQLite ALTER TABLE can add columns but not add CHECK constraints retroactively. Need to handle existing data.
**Action:** Create migration: add `kanban_position INTEGER DEFAULT 0`. For status normalization, run a data migration UPDATE to convert aliases (`todo`→`pending`, `in_progress`→`active`, `done`→`complete`). Don't add CHECK (SQLite limitation) — enforce in application layer.
- I:4 | E:3 | R:2

### 47. API Endpoint Reviewer
**Finding:** The `PUT /api/tasks/:id` endpoint needs to normalize status values on write. It should accept aliases but store canonically. Also needs a new `PATCH /api/tasks/:id/reorder` for kanban position updates.
**Action:** Add status normalization to the existing PUT handler. Add new reorder endpoint. Document the alias mapping.
- I:3 | E:2 | R:1

### 48. Shared Utility Architect
**Finding:** Need to create several new shared modules: `status-config.ts`, `priority-config.ts`, `users.ts`, `filter-state.ts`. These should live in `apps/web/src/lib/` following existing patterns (`toast.ts`, `date.ts`, `ticket-key.ts`).
**Action:** Create the shared modules. Ensure they're tree-shakeable and isomorphic (work in both SSR and client contexts).
- I:3 | E:2 | R:1

### 49. E2E Test Planner
**Finding:** Existing relevant tests: `user-assignment.spec.ts`, `kanban-backlog-mode.spec.ts`, `task-type-api.spec.ts`, `navigation.spec.ts`. No test covers filter persistence across view switches or stat card navigation.
**Action:** Add `filter-consistency.spec.ts` covering: stat card links, filter persistence across views, user filter rendering, sort-by-date, board filter integration.
- I:4 | E:3 | R:1

### 50. Build Verification Specialist
**Finding:** After these changes, need to verify: `pnpm check` (TypeScript), `pnpm build` (Astro build), e2e test suite, and visual verification in the HA devcontainer.
**Action:** Full build verification pipeline: check → build → test → devcontainer visual.
- I:4 | E:2 | R:1

---

## Summary Table

| # | Persona | Finding | I | E | R | Net | Priority |
|---|---------|---------|---|---|---|-----|----------|
| 1 | Data Architect | 6 status values, no canon | 5 | 4 | 3 | +1 | **P0** |
| 2 | Domain Analyst | Lanes ≠ status vocab | 5 | 3 | 2 | +3 | **P0** |
| 3 | Consistency Auditor | PATCH vs PUT, done vs complete | 4 | 3 | 2 | +1 | **P0** |
| 6 | PM (ADHD) | "Total" → "Open" stat | 5 | 1 | 1 | +4 | **P0** |
| 7 | Interaction Designer | Stat cards not clickable | 5 | 2 | 1 | +3 | **P0** |
| 10 | Naming Expert | "My open tasks" → dynamic | 4 | 2 | 1 | +2 | **P0** |
| 11 | ADHD UX Researcher | Unify user filter UX | 5 | 3 | 2 | +3 | **P1** |
| 13 | Filter Consistency | User filter missing in views | 5 | 3 | 2 | +3 | **P1** |
| 16 | Parity Auditor | Unified filter bar | 5 | 4 | 3 | +2 | **P1** |
| 18 | Board Filter Architect | Sidebar → filter bar | 5 | 4 | 3 | +2 | **P1** |
| 21 | Kanban Power User | In-lane reorder | 5 | 4 | 3 | +2 | **P1** |
| 22 | Lane ↔ Status | Swimlanes = Status | 5 | 3 | 2 | +3 | **P0** |
| 26 | Navigation Architect | Stat deep links | 5 | 2 | 1 | +3 | **P0** |
| 33 | Priority Inversion | Today inverted labels **BUG** | 5 | 1 | 1 | +4 | **P0** |
| 36 | Reuse Auditor | Priority config ×6 | 5 | 2 | 1 | +3 | **P1** |
| 42 | Context Switch | Filters lost on view switch | 5 | 2 | 1 | +3 | **P1** |
| 4 | API Contract | No status validation | 4 | 2 | 1 | +2 | P2 |
| 8 | Visual Feedback | Stat hover states | 4 | 2 | 1 | +2 | P2 |
| 15 | Multi-Select | User pill multi-toggle | 4 | 3 | 2 | +1 | P2 |
| 17 | Sort-by-Date | Table date sort | 4 | 2 | 1 | +2 | P2 |
| 19 | Custom Field Filter | Filter by CF values | 4 | 3 | 2 | +1 | P2 |
| 20 | Filter Persistence | Unified filter state | 4 | 3 | 2 | +1 | P2 |
| 27 | Info Scent | Reorder dashboard sections | 4 | 2 | 1 | +2 | P2 |
| 31 | Today Filters | Add filters to Today | 4 | 2 | 1 | +2 | P2 |
| 37 | Status Labels | Deduplicate maps | 4 | 2 | 1 | +2 | P2 |
| 39 | URL Sync | All views sync URL params | 4 | 2 | 1 | +2 | P2 |
| 46 | Migration Safety | kanban_position column | 4 | 3 | 2 | +1 | P2 |
| 49 | E2E Tests | filter-consistency test | 4 | 3 | 1 | +1 | P2 |
| 5 | HA Status Mapper | Consume STATUS_CONFIG | 3 | 2 | 1 | +1 | P3 |
| 9 | Localization | i18n "My open tasks" | 3 | 1 | 1 | +2 | P3 |
| 12 | A11y | Pill keyboard nav | 3 | 2 | 1 | +1 | P3 |
| 14 | Data Flow | User cache utility | 3 | 2 | 1 | +1 | P3 |
| 23 | Kanban Add-Task | Pre-select status | 3 | 2 | 1 | +1 | P3 |
| 28 | Kanban Link | Carry user filter | 3 | 2 | 1 | +1 | P3 |
| 29 | Count Accuracy | Flash-of-wrong count | 2 | 1 | 1 | +1 | P3 |
| 30 | Quick Add Board | Show active board | 3 | 2 | 1 | +1 | P3 |
| 32 | Upcoming Filters | Add filters | 3 | 2 | 1 | +1 | P3 |
| 34 | Status Badges | Add to Today/Upcoming | 3 | 1 | 1 | +2 | P3 |
| 38 | Task Sub-components | Extract shared pieces | 3 | 2 | 2 | +1 | P3 |
| 40 | Sort Direction | Arrow indicators | 3 | 2 | 1 | +1 | P3 |
| 41 | Cognitive Load | Dashboard hierarchy | 4 | 2 | 1 | +2 | P3 |
| 43 | Visual Anchor | Drag confirm pulse | 3 | 1 | 1 | +2 | P3 |
| 44 | Overdue Urgency | Consistent red styling | 3 | 1 | 1 | +2 | P3 |
| 47 | API Endpoints | Normalize + reorder | 3 | 2 | 1 | +1 | P3 |
| 48 | Shared Utils | New lib modules | 3 | 2 | 1 | +1 | P3 |
| 50 | Build Verify | Full pipeline | 4 | 2 | 1 | +2 | P3 |
| 24 | WIP Tooltip | Explain WIP | 2 | 1 | 1 | +1 | P4 |
| 25 | Empty States | Context-aware | 2 | 1 | 1 | +1 | P4 |
| 35 | Quick-Add Unify | Consolidate creation | 3 | 2 | 2 | +1 | **DEFER** |
| 45 | Focus Mode | Hide chrome | 2 | 0 | 0 | — | **DEFER** |

**Verified OK:** None — all items are actionable
**Total actionable items: 48 (2 deferred)**
**P0 (must-fix): 8 | P1 (high-impact): 6 | P2 (important): 13 | P3 (nice-to-have): 19 | P4 (polish): 2**
