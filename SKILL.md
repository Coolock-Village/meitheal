---
name: meitheal-task-management
description: >
  Manage household tasks, to-do lists, and projects through Meitheal,
  a Home Assistant addon. Create, search, complete, update, and delete tasks.
  Get daily briefings, overdue reports, and calendar events. Use when the user
  mentions tasks, to-do lists, reminders, scheduling, daily planning, or
  household management.
license: Apache-2.0
compatibility: >
  Requires a running Meitheal addon instance inside Home Assistant.
  MCP endpoint at /api/mcp, REST API at /api/tasks.
  Works with any MCP-compatible agent (Claude, Antigravity, Codex).
metadata:
  author: Coolock-Village
  version: "0.3.0"
  homepage: https://github.com/Coolock-Village/meitheal
allowed-tools:
  - Read files
  - Fetch URLs
---

# Meitheal Task Management Skill

Meitheal (pronounced "meh-hal") is a cooperative task and life management engine
running as a Home Assistant addon. This skill enables agents to manage tasks,
calendar events, and daily planning through Meitheal's APIs.

## When to Use This Skill

Use this skill when the user:
- Asks to create, update, complete, or delete tasks
- Wants to see what's overdue, due today, or coming up
- Asks for a daily briefing or morning summary
- Mentions their to-do list, task list, or household tasks
- Wants to sync or check calendar events
- Asks "what's on my plate?" or "how am I doing?"

## API Access

### MCP (Preferred for Agents)

Send JSON-RPC 2.0 to `POST /api/mcp`:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "createTask",
    "arguments": { "title": "Buy groceries", "priority": 2 }
  }
}
```

Available MCP tools (13):
- `createTask` — title (required), description, priority (1-5), due_date
- `searchTasks` — query, status (backlog/todo/in_progress/done), priority
- `completeTask` — id or title
- `updateTask` — id (required), title, status, priority, due_date, description
- `deleteTask` — id (required)
- `getTask` — id (required) — returns full details including labels, timestamps
- `getOverdueTasks` — no params — all tasks past due date
- `getTodaysTasks` — no params — today's tasks + overdue
- `getTaskSummary` — no params — counts: total, active, overdue, done
- `dailyBriefing` — no params — greeting, tasks, weather, who's home
- `getCalendarEvents` — days_ahead (default: 7)
- `getUpcoming` — days_ahead (default: 7) — combined tasks + calendar
- `batchComplete` — label, max_priority, or titles array

### REST API (Alternative)

- `GET /api/tasks` — list all tasks
- `POST /api/tasks/create` — `{ title, frameworkPayload: { description } }`
- `PUT /api/tasks/:id` — `{ status, priority, due_date, description }`
- `DELETE /api/tasks/:id`

### Discovery

- `GET /.well-known/mcp.json` — MCP server discovery
- `GET /.well-known/agent-card.json` — A2A agent card

## Task Data Model

```
id: UUID string
title: string
status: backlog | todo | in_progress | done | cancelled
priority: 1 (urgent) to 5 (lowest), default 3
description: string or null
due_date: ISO 8601 date or null
labels: string array
```

## Important Notes

- Priority 1 = urgent/highest, 5 = lowest. Default is 3 (medium).
- Status flow: backlog → todo → in_progress → done, or todo → cancelled.
- When completing by title, the match is case-insensitive exact match.
- `batchComplete` requires at least one filter (label, max_priority, or titles) — won't complete everything without a filter.
- Authentication is handled by HA Supervisor ingress. No separate auth needed when accessed through HA.
