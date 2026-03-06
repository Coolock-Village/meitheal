---
name: meitheal-core-workflows
description: Core task management workflows for Meitheal — create, update, complete, delete, search, and sync tasks within Home Assistant.
version: 1.0.0
---

# Meitheal Core Workflows

Standard operating procedures for the Meitheal task management system.

## Available Workflows

- **Create Task** — `POST /api/tasks` with title (required), description, priority (1-5), due_date
- **Update Task** — `PUT /api/tasks/:id` with any combination of title, status, priority, due_date, description
- **Complete Task** — `PUT /api/tasks/:id` with `{ status: "done" }`
- **Delete Task** — `DELETE /api/tasks/:id`
- **Search Tasks** — `GET /api/tasks?q=keyword&status=backlog|todo|in_progress|done&priority=1-5`
- **Sync Calendars** — `POST /api/integrations/calendar/sync` triggers HA calendar sync
- **Daily Briefing** — `GET /api/v1/tasks/insights` returns overdue, due-today, upcoming counts

## Status Flow

```text
backlog → todo → in_progress → done
                 todo → cancelled
```

## Priority Scale

| Value | Meaning |
| ----- | ------- |
| 1 | Urgent / Critical |
| 2 | High |
| 3 | Medium (default) |
| 4 | Low |
| 5 | Lowest |

## Integration Points

- Home Assistant services: `meitheal.create_task`, `meitheal.search_tasks`, `meitheal.complete_task`
- MCP tools: 13 tools via `/api/mcp` or Python MCP server
- Voice: Custom sentences for Assist (`create a task called ...`, `what's on my list?`)
