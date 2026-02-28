# Phase 15: UX Parity & Board Domain Separation - Context

**Gathered:** 2026-02-28
**Status:** Executed (reconciled with plan/summary artifacts)

<domain>
## Phase Boundary

This phase delivers Trello/Jira-level UX parity across kanban, task detail, settings, and introduces **Boards** as DDD bounded contexts for task domain separation. The end result: users can organize tasks into multiple boards, click cards to see full detail views, configure integrations comprehensively, and experience premium UX on dropdowns, forms, and card interactions.

</domain>

<decisions>
## Implementation Decisions

### Boards / DDD Domain Separation

- Tasks belong to boards (like Trello boards or Jira projects)
- Default board auto-created on first run
- Board switcher in sidebar — switch active board context
- All views (kanban, list, table) filter by active board
- DB: `boards` table (id, title, icon, color, position, created_at, updated_at)
- DB: `board_id` column on `tasks` table (FK, default 'default')
- **Already started:** schema migration added, needs API + UI

### Kanban Card UX (Trello Parity)

- Priority color bar on left edge of card ✅ DONE
- Description preview (truncated to 2 lines) ✅ DONE
- Action icons on hover (edit, AI, duplicate) ✅ DONE
- Click anywhere on card → opens task detail ✅ DONE (navigates to /tasks#edit-{id})
- Custom lanes render as columns from localStorage ✅ DONE
- Inline Add Task form (not prompt()) ✅ DONE

### Task Detail View

- Clicking a task from any view opens a full detail panel/modal
- From kanban: currently navigates to /tasks#edit-{id} — needs hash handler
- Task detail should show: all fields, subtasks, time tracked, labels, custom fields
- Trello-style: card opens as overlay with full edit capability

### Custom Fields

- Save button with API persistence ✅ DONE
- URL field type added ✅ DONE
- Fields persist to settings API as JSON

### Settings Page Comprehensiveness

- Each integration has: description, config form, setup instructions, status badge ✅ DONE
- Integrations: Calendar Sync, Grocy, n8n/Node-RED, Webhooks, AI Provider ✅ DONE
- Jira-style card customization: configurable which fields show on kanban cards

### Table Dropdown UX + A11y

- Dark-themed selects with custom dropdown arrow ✅ DONE
- aria-label on all interactive elements ✅ DONE
- ARIA interpolation fixed in sidebar ✅ DONE
- Table checkboxes labeled ✅ DONE

</decisions>

<specifics>
## Specific References

- "Trello Cards is 100% not at parity" — user wants Trello-level card UX
- "The UX is so much better <https://trello.com/inbox>" — Trello inbox as UX inspiration
- "Card types should be configurable" — ref: <https://support.atlassian.com/jira-software-cloud/docs/customize-cards/>
- "The Multiple Boards or DDD domain separation of tasks is not present" — critical gap
- "There is no configuration or explanation here" — settings Integrations section was bare

</specifics>

<deferred>
## Deferred Ideas

- Trello-style inbox/notifications view
- Card cover images
- Jira-style JQL queries for card coloring
- Board templates (Personal, Work, Sprint, etc.)
- Board sharing / multi-user (blocked on auth model)

</deferred>

---

*Phase: 15-ux-parity-boards*
*Context gathered: 2026-02-28*
