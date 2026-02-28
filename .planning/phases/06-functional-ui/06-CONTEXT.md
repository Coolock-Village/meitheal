# Phase 6: Functional UI & Feature Parity — Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

## Phase Boundary

Deliver a fully functional task management UI that **exceeds Vikunja** across all gap matrix capabilities and meets parity spec Must-Meet floor for Super Productivity. This is the surface layer that makes all backend capabilities (Phases 1–5) usable.

**Current state:** API routes exist (tasks CRUD, calendar sync, webhooks, health), but UI is a blank landing page with 3 lines of unstyled text. No task management interface exists.

**Target state:** Production-ready task management application with:
- Multiple task views (list, kanban, table)
- Task CRUD with real persistence
- HA-native integration surfaces (calendar sync, status indicators)
- Framework scoring (RICE/DRICE) visible in UI
- Dark-mode, responsive, premium design
- Working in HA container

## Implementation Decisions

### Task Views (Gap Matrix: Strong target)
- **List view** — primary view, default. Sortable, filterable, grouped by status/priority/due date.
- **Kanban board** — drag-and-drop columns by status (pending/in_progress/done). Vikunja has this; we must too.
- **Table view** — spreadsheet-style with inline editing. Vikunja has this; we must too.
- Gantt chart deferred to future phase (complex dependency).

### Task Management
- Full CRUD: create, read, update, delete with optimistic UI.
- Tasks have: title (required), description (markdown), status, priority (1-5), due_date, labels, assignees.
- Quick-add: single-line input at top of list for rapid task creation.
- Inline editing: click title/description to edit in-place.
- Bulk actions: select multiple → change status, delete, assign label.
- Subtasks: nested task hierarchy (1 level deep minimum).

### Framework Scoring (Meitheal Differentiator)
- RICE score visible on each task card (Reach × Impact × Confidence / Effort).
- DRICE variant with user-configurable weights.
- HEART overlay for UX-focused scoring.
- Scoring drives sort order in list/table views.

### HA-Native Integration Surfaces
- Calendar sync status badge on tasks (confirmed/pending/failed).
- Health status indicator in sidebar (green/amber/red).
- Integration status panel showing HA connection, Grocy, calendar entity.
- "Sync now" button for manual calendar sync trigger.

### Offline-First UX (Super Productivity Parity)
- Tasks load from IndexedDB first, sync in background.
- Offline indicator in UI when disconnected.
- Pending sync count badge.
- Conflict notification when server state differs.

### Design System
- Dark theme (Irish-inspired: deep navy + emerald green).
- Inter font family.
- Sidebar navigation with collapsible mobile menu.
- Toast notifications for actions.
- Modal dialogs for create/edit forms.
- Responsive: desktop sidebar → mobile hamburger.
- Premium feel: hover effects, micro-animations, glassmorphism cards.

### Labels & Projects
- Label CRUD with color picker.
- Labels displayed as colored badges on task cards.
- Project switcher in sidebar (maps to Vikunja projects).
- Filter by label, status, priority, assignee, due date.

### Search & Filters
- Global search bar in topbar.
- Saved filter presets (e.g. "My Tasks Due This Week").
- Filter chips that can be combined.

## Specific Ideas

- "Villager" avatars for assignees matching Meitheal ubiquitous language.
- Shamrock (☘) logo icon throughout.
- Status labels use Meitheal terms: "Pending", "Active", "Complete" (not "To Do"/"Done").
- Empty states with helpful onboarding text.
- Keyboard shortcuts for power users (n = new task, / = search).

## Deferred Ideas

- Gantt chart view (complex, needs dependency engine)
- Time tracking / Pomodoro timer (Super Productivity feature, separate phase)
- Passkeys/WebAuthn (R-401, separate auth phase)
- Obsidian sync (separate integration phase)
- Portfolio/workload planning (needs Endeavors domain, separate phase)

---

*Phase: 06-functional-ui*
*Context gathered: 2026-02-28*
