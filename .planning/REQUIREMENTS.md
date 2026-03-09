# Core Feature Completion — Requirements

**Project:** Meitheal Core Feature Completion Sprint
**Version:** v1 (derived from gap analysis + CONCERNS.md audit)
**Date:** 2026-03-09

---

## Subtask Tree UI (SUB)

- [ ] **SUB-01**: Subtask indent/tree display in Table view — child tasks indented under parent with expand/collapse
- [ ] **SUB-02**: Subtask count badge on Kanban cards — show "3/5 subtasks" chip when task has children
- [ ] **SUB-03**: "Add subtask" action in task detail panel — create child task with parent_id auto-set
- [ ] **SUB-04**: Subtask progress bar on parent task — visual completion percentage based on done subtasks
- [ ] **SUB-05**: Subtask list in task detail panel — show child tasks with inline checkbox completion
- [ ] **SUB-06**: Drag-to-nest in Table view — drag a task onto another to make it a subtask

## Recurrence Picker (REC)

- [ ] **REC-01**: RecurrencePicker Astro component — select daily/weekly/monthly/yearly/custom
- [ ] **REC-02**: Wire RecurrencePicker into NewTaskModal — set recurrence_rule on task creation
- [ ] **REC-03**: Wire RecurrencePicker into task detail edit panel — modify recurrence on existing tasks
- [ ] **REC-04**: Recurrence badge on task cards across all views — visual indicator (🔁 icon)
- [ ] **REC-05**: Auto-create next occurrence on task completion — clone task with next due date when recurring task completed
- [ ] **REC-06**: Recurrence rule parser — human-readable display ("Every Monday", "Monthly on the 15th")

## Checklist UI (CHK)

- [ ] **CHK-01**: Checklist section in task detail panel — render checklist items with checkboxes
- [ ] **CHK-02**: Add/remove checklist items inline — text input to append new items
- [ ] **CHK-03**: Checklist progress indicator on task cards — show "2/5" or progress bar
- [ ] **CHK-04**: Reorder checklist items via drag-and-drop in detail panel
- [ ] **CHK-05**: Wire checklists into NewTaskModal — add checklist items during task creation
- [ ] **CHK-06**: Save/load checklists from task templates — template system preserves checklist items

## SQL Migration (SQL)

- [ ] **SQL-01**: Create `@meitheal/domain-tasks` query module with typed functions for task CRUD (findAll, findById, create, update, delete)
- [ ] **SQL-02**: Create board query module — board CRUD functions in domain package
- [ ] **SQL-03**: Create label query module — label CRUD functions in domain package
- [ ] **SQL-04**: Migrate `/api/tasks/index.ts` and `/api/tasks/[id].ts` to use domain query functions
- [ ] **SQL-05**: Migrate `/api/boards/*` routes to use domain query functions
- [ ] **SQL-06**: Migrate `/api/labels*` routes to use domain query functions
- [ ] **SQL-07**: Migrate remaining API routes (comments, activity, templates, gamification) to domain queries
- [ ] **SQL-08**: Migrate export routes to use domain queries where applicable

## Page Decomposition (PGD)

- [ ] **PGD-01**: Extract Kanban `is:inline` script (~800 lines) into `lib/kanban-controller.ts`
- [ ] **PGD-02**: Extract Table `is:inline` script (~500 lines) into `lib/table-controller.ts`
- [ ] **PGD-03**: Extract Dashboard `is:inline` script (~300 lines) into `lib/dashboard-controller.ts`
- [ ] **PGD-04**: Extract Settings `is:inline` scripts into per-tab modules (`lib/settings-general.ts`, etc.)
- [ ] **PGD-05**: Extract Layout.astro inline scripts into `lib/layout-controller.ts` — command palette, shortcuts, health

## Smart Today (SMT)

- [ ] **SMT-01**: "Suggested" section on Today page — shows overdue + high-priority tasks not yet on today's list
- [ ] **SMT-02**: Quick-add-to-today action — one-click to move suggested task to today's focus
- [ ] **SMT-03**: Daily summary stats — completed/remaining/overdue counts at top of Today page

## Version Sync Automation (VER)

- [ ] **VER-01**: Create `scripts/check-version-sync.mjs` — validates config.yaml, run.sh, sw.js versions match
- [ ] **VER-02**: Add version sync check to CI pipeline — fails if versions don't match
- [ ] **VER-03**: Create `scripts/bump-version.mjs` — updates all 3 files atomically with new version

## Scope

### v1 (this sprint)
All requirements above (SUB-01 through VER-03) — 35 requirements total

### v2 (deferred)
- NLP quick add ("Buy milk tomorrow at 3pm #errands")
- Calendar drag-to-reschedule
- Pomodoro timer (HA timer entity integration)
- Time tracking UI (timer start/stop against `time_tracked` column)
- File attachments on tasks
- Yearly contribution heatmap
- Drizzle ORM adoption or removal
- Dual label system unification
- Layout.astro full decomposition (beyond script extraction)

### Out of Scope
- New authentication system (HA handles auth)
- Mobile native apps (PWA is sufficient)
- Social/multiplayer features (leaderboards, parties)
- Cloudflare Workers deployment (apps/api/)

---

## Traceability

| Phase | Requirements |
|-------|-------------|
| 1 | SUB-01, SUB-02, SUB-03, SUB-04, SUB-05, SUB-06 |
| 2 | REC-01, REC-02, REC-03, REC-04, REC-05, REC-06 |
| 3 | CHK-01, CHK-02, CHK-03, CHK-04, CHK-05, CHK-06 |
| 4 | SQL-01, SQL-02, SQL-03, SQL-04, SQL-05, SQL-06, SQL-07, SQL-08 |
| 5 | PGD-01, PGD-02, PGD-03, PGD-04, PGD-05 |
| 6 | SMT-01, SMT-02, SMT-03, VER-01, VER-02, VER-03 |

*Requirements: 2026-03-09 — core feature completion sprint*
