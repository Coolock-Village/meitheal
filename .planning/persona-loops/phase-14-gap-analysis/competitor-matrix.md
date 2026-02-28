# Phase 14: Gap Analysis — Jira, Super Productivity, Trello, Vikunja

## Audit Date: 2026-02-28

## Competitor Feature Matrix

| Feature | Meitheal | Jira | Super Prod | Trello | Vikunja |
|---------|----------|------|------------|--------|---------|
| **Core Tasks** | | | | | |
| Task CRUD | ✅ | ✅ | ✅ | ✅ | ✅ |
| Subtasks | ❌ | ✅ | ✅ | ✅ | ✅ |
| Recurring tasks | ❌ | ✅ | ✅ | ❌ | ✅ |
| Task comments | ❌ | ✅ | ❌ | ✅ | ✅ |
| Attachments | ❌ | ✅ | ❌ | ✅ | ✅ |
| Due dates | ✅ | ✅ | ✅ | ✅ | ✅ |
| Priority levels | ✅ | ✅ | ✅ | ❌ | ✅ |
| Labels/tags | ✅ | ✅ | ✅ | ✅ | ✅ |
| Task duplicate | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Views** | | | | | |
| List view | ✅ | ✅ | ✅ | ❌ | ✅ |
| Kanban board | ✅ | ✅ | ✅ | ✅ | ✅ |
| Table view | ✅ | ❌ | ❌ | ❌ | ✅ |
| Calendar view | ❌ | ✅ | ✅ | ✅ | ✅ |
| Gantt/Timeline | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Agile** | | | | | |
| Sprints | ❌ | ✅ | ❌ | ❌ | ❌ |
| Backlog | ❌ | ✅ | ✅ | ❌ | ❌ |
| Story points | ❌ | ✅ | ❌ | ❌ | ❌ |
| Framework scoring | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Time** | | | | | |
| Time tracking | ❌ | ✅ | ✅ | ❌ | ❌ |
| Pomodoro timer | ❌ | ❌ | ✅ | ❌ | ❌ |
| Idle detection | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Integrations** | | | | | |
| Home Assistant | ✅ | ❌ | ❌ | ❌ | ⚠️ |
| Calendar sync (HA) | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| GitHub issues sync | ❌ | ✅ | ✅ | ❌ | ❌ |
| Jira sync | ❌ | N/A | ✅ | ❌ | ❌ |
| CalDAV | ❌ | ❌ | ✅ | ❌ | ❌ |
| Webhooks/n8n | ✅ | ✅ | ❌ | ✅ | ✅ |
| **AI & Automation** | | | | | |
| AI prompt menu | ❌ | ✅ | ✅ | ❌ | ❌ |
| Quick Add Magic | ✅ | ❌ | ❌ | ❌ | ✅ |
| Automation rules | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Meta** | | | | | |
| OpenAPI spec | ✅ | ✅ | ❌ | ✅ | ✅ |
| LLMs.txt | ✅ | ❌ | ❌ | ❌ | ❌ |
| PWA/Offline | ✅ | ❌ | ✅ | ❌ | ❌ |
| Security headers | ✅ | ✅ | N/A | ✅ | ⚠️ |
| Keyboard shortcuts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Swimlane management | ✅ | ✅ | ❌ | ✅ | ❌ |
| Dark mode | ✅ | ✅ | ✅ | ✅ | ✅ |

## Findings — Where We Lag

### P0 — Must have for parity

1. ❌ **Subtasks** — All 4 competitors support this
2. ❌ **Time tracking** — Super Prod and Jira core feature

### P1 — Should have

3. ❌ **AI prompt menu** — "Ask AI about this task" (SP #6648, coolock-village-forge has ask-ai)
2. ❌ **Recurring tasks** — Jira, SP, Vikunja all support

### P2 — Nice to have

5. ❌ **Calendar view** — Visual timeline
2. ❌ **Task comments** — Discussion threads
3. ❌ **Attachments** — File uploads
4. ❌ **Pomodoro timer** — SP differentiator

### P3 — Future

9. ❌ **GitHub issues sync** — SP + Jira feature
2. ❌ **Sprints/Backlog** — Jira core, not needed for household use
3. ❌ **Gantt/Timeline** — Jira Premium

## Where We Win

| Advantage | Meitheal | Competitors |
|-----------|----------|-------------|
| Home Assistant native | ✅ First-class | None have this |
| Framework scoring (RICE/HEART) | ✅ Unique | None |
| DDD architecture | ✅ Clean boundaries | Monoliths |
| LLMs.txt | ✅ AI-ready | None |
| Dual-runtime (HA + CF) | ✅ | None |
| Vikunja compat layer | ✅ Migration path | N/A |
| Quick Add Magic | ✅ | Only Vikunja |
| Table view | ✅ | Only Vikunja |

## Implementation Plan (P0-P1)

### 1. Subtasks (P0)

- Add `parent_id` column to tasks table
- Display indented subtasks in list/table
- Nest in kanban cards
- API: `POST /api/tasks` with `parent_id`

### 2. Time Tracking (P0)

- Add `time_tracked` column (integer, seconds)
- Simple start/stop timer in task detail
- Dashboard widget for daily total

### 3. AI Prompt Menu (P1)

- "Ask AI" button on tasks (inspired by SP #6648)
- Configurable provider (ChatGPT, Claude, Gemini, local)
- Opens task context as a prompt in selected provider

### 4. Recurring Tasks (P1)

- Add `recurrence` column (JSON: frequency, interval, end_date)
- Cron-like scheduler in HA add-on
- Auto-create next occurrence on completion
