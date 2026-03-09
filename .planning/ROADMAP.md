# Core Feature Completion — Roadmap

**Project:** Meitheal Core Feature Completion Sprint
**Phases:** 6
**Requirements:** 35
**Date:** 2026-03-09
**Status:** 🔄 IN PROGRESS

---

## Progress

| # | Phase | Status | Date |
|---|-------|--------|------|
| 1 | Subtask Tree UI | ⬜ Not started | — |
| 2 | Recurrence Engine | ⬜ Not started | — |
| 3 | Checklist UI | ⬜ Not started | — |
| 4 | SQL Domain Migration | ⬜ Not started | — |
| 5 | Page Decomposition | ⬜ Not started | — |
| 6 | Smart Today + Tooling | ⬜ Not started | — |

---

## Phase 1: Subtask Tree UI

**Goal:** Surface the existing parent_id data model as a full subtask experience — users can see, create, and manage subtasks across all views.

**Requirements:** SUB-01, SUB-02, SUB-03, SUB-04, SUB-05, SUB-06

**Success Criteria:**
1. User can see child tasks indented under parent in Table view with expand/collapse
2. Kanban cards show subtask count badge ("3/5 subtasks") when task has children
3. User can add a subtask from the task detail panel, and it inherits parent's board
4. Parent task shows visual completion percentage based on child task status
5. User can view and complete child tasks inline in the task detail panel

**Dependencies:** None — `parent_id` column and API support already exist.

---

## Phase 2: Recurrence Engine

**Goal:** Let users set recurring schedules on tasks and have new occurrences auto-created on completion.

**Requirements:** REC-01, REC-02, REC-03, REC-04, REC-05, REC-06

**Success Criteria:**
1. RecurrencePicker component renders daily/weekly/monthly/yearly/custom options
2. User can set recurrence when creating a task via NewTaskModal
3. User can edit recurrence rule on existing tasks in the detail panel
4. Recurring tasks show a 🔁 badge on cards across all views
5. Completing a recurring task auto-creates the next occurrence with the correct due date
6. Recurrence rules display in human-readable format ("Every Monday")

**Dependencies:** `recurrence_rule` column exists. `domains/tasks/recurrence.ts` has some parsing logic.

---

## Phase 3: Checklist UI

**Goal:** Enable inline checklist management within tasks — users can create, check off, reorder, and track checklist items.

**Requirements:** CHK-01, CHK-02, CHK-03, CHK-04, CHK-05, CHK-06

**Success Criteria:**
1. Task detail panel renders checklist items with functional checkboxes
2. User can add/remove checklist items inline
3. Task cards show checklist progress ("2/5" or progress bar)
4. Checklist items can be reordered via drag-and-drop
5. NewTaskModal includes checklist section
6. Templates preserve and restore checklist items

**Dependencies:** `checklists` JSON column exists in tasks table. Template system already stores checklists.

---

## Phase 4: SQL Domain Migration

**Goal:** Eliminate inline SQL from API routes by extracting queries into typed domain package functions. Improves testability, reduces duplication, enforces consistent patterns.

**Requirements:** SQL-01, SQL-02, SQL-03, SQL-04, SQL-05, SQL-06, SQL-07, SQL-08

**Success Criteria:**
1. `@meitheal/domain-tasks` exports typed CRUD functions (findAll, findById, create, update, delete)
2. Board and label queries encapsulated in domain modules
3. All task API routes use domain query functions instead of inline SQL
4. Board and label API routes migrated
5. Comment, activity, template, and gamification routes migrated
6. Export routes use domain queries
7. Zero test regressions after migration

**Dependencies:** Phases 1-3 (new features should write domain queries from the start, not inline SQL).

---

## Phase 5: Page Decomposition

**Goal:** Extract large inline scripts from monolith Astro pages into typed TypeScript modules. Enables IDE support, type checking, and unit testing.

**Requirements:** PGD-01, PGD-02, PGD-03, PGD-04, PGD-05

**Success Criteria:**
1. Kanban page inline script extracted to `lib/kanban-controller.ts` with full type coverage
2. Table page inline script extracted to `lib/table-controller.ts`
3. Dashboard inline script extracted to `lib/dashboard-controller.ts`
4. Settings tabs extracted to per-tab modules
5. Layout.astro scripts (command palette, shortcuts, health) extracted to `lib/layout-controller.ts`
6. All extracted modules are importable and type-checkable via `astro check`

**Dependencies:** Phase 4 (SQL migration should be done first so extracted scripts use domain queries).

---

## Phase 6: Smart Today + Tooling

**Goal:** Enhance the Today page with smart suggestions and add developer tooling for version management.

**Requirements:** SMT-01, SMT-02, SMT-03, VER-01, VER-02, VER-03

**Success Criteria:**
1. Today page shows "Suggested" section with overdue + high-priority tasks not in today's list
2. User can one-click add a suggested task to today's focus
3. Daily summary shows completed/remaining/overdue counts
4. `scripts/check-version-sync.mjs` validates version consistency
5. CI fails on version mismatch
6. `scripts/bump-version.mjs` updates all 3 version files atomically

**Dependencies:** None (can run in parallel with Phase 5).

---

*Roadmap: 2026-03-09 — derived from gap analysis + CONCERNS.md P0-P4*
