# Vikunja 1:1 Gap Analysis — Phase 9

## Feature Comparison

| Feature | Vikunja | Meitheal | Gap | Priority |
| --- | --- | --- | --- | --- |
| **Views** | | | | |
| List view | ✅ | ✅ tasks.astro | None | — |
| Kanban board | ✅ drag-n-drop | ✅ kanban.astro with drag-drop | None | — |
| Table view | ✅ configurable columns | ✅ table.astro with inline editing | None | — |
| Gantt chart | ✅ | ❌ | Gap | P3 |
| **Task Features** | | | | |
| Quick add (title) | ✅ | ✅ dashboard + tasks page | None | — |
| Quick Add Magic (parse dates/labels) | ✅ NLP-like parsing | ❌ | Gap | P2 |
| Subtasks | ✅ | ❌ | Gap | P2 |
| Repeating tasks | ✅ intervals | ❌ | Gap | P3 |
| Reminders | ✅ | ❌ | Gap | P2 |
| Due dates | ✅ | ✅ with relative time display | None | — |
| Priorities (1-5) | ✅ | ✅ 1-5 with color coding | None | — |
| Labels/Tags | ✅ colored, clickable | ⚠️ stored as JSON, no UI | Partial | P1 |
| Description (rich text) | ✅ markdown | ✅ plain text, sanitized | Partial | P3 |
| Attachments | ✅ file upload | ❌ | Gap | P3 |
| Relations | ✅ subtask, blocking, etc. | ❌ | Gap | P3 |
| **Organization** | | | | |
| Projects | ✅ hierarchical | ❌ flat task list | Gap | P1 |
| Saved filters | ✅ | ⚠️ localStorage filter persistence | Partial | P2 |
| Delegation/Assignees | ✅ | ❌ | Gap | P3 |
| Teams | ✅ | ❌ | Gap | P4 |
| **Navigation** | | | | |
| Overview/Dashboard | ✅ greeting, recent, tasks | ✅ greeting, stats, recent tasks | None | — |
| Upcoming view | ✅ chronological | ❌ | Gap | P2 |
| Project sidebar | ✅ collapsible tree | ⚠️ flat nav (no projects yet) | Partial | P1 |
| Search | ✅ global | ⚠️ API has search, no global UI | Partial | P1 |
| Notification bell | ✅ | ❌ | Gap | P3 |
| User avatar | ✅ | ❌ | Gap | P4 |
| **Settings** | | | | |
| General settings | ✅ | ✅ HA connection, frameworks | None | — |
| Localization | ✅ language, TZ, date format | ⚠️ timezone from HA only | Partial | P2 |
| Appearance (theme) | ✅ color scheme, brightness | ❌ dark-only | Gap | P3 |
| Default view preference | ✅ | ❌ | Gap | P2 |
| CalDAV integration | ✅ | ❌ (HA calendar sync different) | Gap | P3 |
| Import (Todoist/Trello/MSFT) | ✅ | ❌ | Gap | P4 |
| API Tokens | ✅ | ❌ | Gap | P3 |
| **Integration** | | | | |
| HA Calendar sync | ❌ | ✅ first-class | Meitheal advantage | — |
| HA Ingress | ❌ | ✅ native | Meitheal advantage | — |
| HA Connection test | ❌ | ✅ /api/ha/connection | Meitheal advantage | — |
| Vikunja compat API | ❌ | ✅ /api/v1/tasks etc. | Meitheal advantage | — |
| Framework scoring (RICE etc.) | ❌ | ✅ configurable | Meitheal advantage | — |
| SSRF protection | ❌ | ✅ unfurl API | Meitheal advantage | — |

## High-Priority Gaps to Close (P1)

1. **Labels UI** — Currently labels are stored as JSON but have no creation/edit/filter UI
2. **Global search** — API supports search, need search UI in topbar
3. **Projects/namespaces** — Flat task list vs hierarchical organization

## Implementation Plan

These P1 items will be implemented to close the most critical gaps with Vikunja.
