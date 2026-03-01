# Phase 31: UX Ascendancy (Meitheal vs. Vikunja Parity)

This plan addresses the UI/UX gaps identified in the `51-vikunja-ui-audit.md` (Persona #50 cross-phase audit), focusing on improving Meitheal's spatial awareness, navigation, and view flexibility to exceed Vikunja's consumer-grade baseline.

## Goal Description

Enhance Meitheal's UI/UX to match and exceed Vikunja's standards. We will prioritize three core areas:
1. **Breathing Room**: Refactor the task detail panel to feel less cramped, improving typography and spacing.
2. **Contextual View Switcher**: Introduce a tabbed navigation within the main task view to seamlessly toggle between List, Board, Table, and Calendar/Gantt views without losing filter context.
3. **Gantt / Timeline View**: Introduce a first-class Gantt/Timeline view for long-term project planning (critical gap).

## User Review Required

> [!CAUTION]
> This plan proposes introducing a new `Gantt` component and restructuring how views are selected. Does this align with the current DDD constraints and component structure? 

> [!NOTE]
> Are you bringing in an external library for the Gantt view (e.g., frappe-gantt, dhtmlx-gantt), or should it be built bespoke using CSS grid/flexbox like the Kanban board? A bespoke approach maintains our zero-dependency/perf-budget philosophy.

## Proposed Changes

### Task Detail Refactor ("Breathing Room")
Refactor the slide-out panel (`src/components/tasks/TaskDetailPanel.tsx` or `.astro` equivalent).
- Increase padding and internal margins.
- Adjust typography hierarchy (`text-sm` vs `text-base` vs `text-lg`).
- **Stretch goal:** On extra-wide screens (`xl:` or `2xl:` breakpoint), reorganize the layout to place metadata (labels, dates, priority) on a right-side column, mimicking Vikunja's modal layout, keeping the title/description area focused.

#### [MODIFY] `src/components/tasks/...` (Detail Panel)
- Update CSS utility classes (Tailwind/UnoCSS or custom CSS depending on setup) to increase whitespace.
- Adjust font weights and sizes for clearer visual hierarchy.

### Contextual View Switcher
Introduce a tab bar at the top of the main tasks container.
- Currently, view switching likely happens via the sidebar or complex URL routes.
- Add a new component `TaskViewTabs` that renders buttons for: `[List] [Board] [Table] [Timeline]`.
- Clicking these updates the central content area (or changes the URL query param `?view=board` to preserve state) without dropping current search queries or list context (e.g., "Inbox" or "Today").

#### [MODIFY] `src/pages/tasks.astro` (or relevant main tasks page)
- Integrate the new `TaskViewTabs` component above the task list/board render area.
- Manage state/URL params to render the corresponding child component (`TaskList`, `KanbanBoard`, `TaskTable`, `GanttChart`).

### Timeline / Gantt View
Create a brand new view for visualizing tasks over time.

#### [NEW] `src/components/tasks/GanttView.tsx` (or `.astro`)
- Implement a timeline grid based on task `start_date` and `due_date`.
- Group tasks by Epic or List.
- (If bespoke): Utilize CSS Grid where rows are tasks/epics and columns are days/weeks.

## Verification Plan

### Automated Tests
1. **Type Checking:** Run `pnpm check` to ensure no TypeScript regressions.
2. **Component Tests:** If existing Vitest/Playwright tests exist for the Task components, run them to verify the refactor hasn't broken DOM node expectations (e.g., `findByRole('button', { name: /save/i })`).
3. **Build Check:** Run `pnpm build` to verify the new components do not violate performance budgets.

### Manual Verification
1. **Visual Inspection:** Open `http://localhost:4322/tasks`.
   - Verify the new Tabbed View Switcher appears.
   - Click between List, Board, and Table to ensure context (filters/selected list) is maintained.
2. **Task Detail Inspection:** Click a task to open the panel.
   - Verify increased padding and improved typography.
   - On a large monitor (>1500px width), verify if the two-column metadata layout activates (if implemented).
3. **Gantt Observation:** Switch to the new Timeline/Gantt view and verify tasks stretch across their respective date ranges correctly.
