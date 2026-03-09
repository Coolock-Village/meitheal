# Meitheal — Core Feature Completion Sprint

## What This Is

Meitheal is a Home Assistant add-on for task/project management (v0.1.99). The previous sprint delivered Labels + Gamification. This sprint focuses on **surfacing hidden backend capabilities** (subtasks, recurrence, checklists) as user-facing features, **addressing critical architecture debt** (inline SQL, monolith pages), and **closing competitive gaps** identified in the TickTick/Todoist gap analysis.

## Core Value

Unlock the full power of Meitheal's data model — users currently can't access subtasks, recurrence, or checklists without raw API calls. Simultaneously, harden the codebase architecture for maintainability and testability.

## Current State (v0.1.99)

- **196+ files**, ~23k lines (TypeScript + Astro) — after dead code sweep
- **275 passing tests** (0 failures)
- **Build passes**, typecheck clean (0 errors, 5 hints)
- Subtasks: `parent_id` in DB + API, **no UI**
- Recurrence: `recurrence_rule` in DB + templates, **no picker UI**
- Checklists: `checklists` JSON field in DB + templates, **no inline UI**
- Inline SQL across 64 API routes (P0 concern)
- Large monolith pages: kanban (1700), settings (2200), table (1000) lines

## Sprint Goals

1. **Subtask Tree UI** — Nested/indent display in table/tasks views, subtask badges on kanban cards, "Add subtask" action in task detail
2. **Recurrence Picker** — UI component to set daily/weekly/monthly/custom recurrence rules in create/edit modals
3. **Checklist UI** — Inline checkbox items within task detail panel, checklist creation in create/edit flow
4. **SQL Migration** — Extract inline SQL from API routes into `@meitheal/domain-tasks` query functions
5. **Page Decomposition** — Extract `is:inline` scripts from monolith pages into typed `.ts` modules
6. **Smart Today** — "Suggested" section showing overdue + high-priority tasks
7. **Version Sync Automation** — Build hook to validate version consistency across config.yaml/run.sh/sw.js

## Tech Stack

- Astro 5.18 SSR (Node adapter) inside HA Supervisor
- SQLite via @libsql/client (raw SQL, parameterized)
- TypeScript 5.9 strict mode
- pnpm 10.8 monorepo with 5 domain packages
- Tailwind 3.4 + 17 CSS partials

## Constraints

- **Astro-native/first** — no React, no SPA patterns
- **HA Supervisor ingress** — all URLs must be ingress-aware
- **Zero regressions** — 275 tests must pass after each phase
- **DDD boundaries** — new features in appropriate bounded contexts
- **KCS** — all behavior changes documented inline
- **Production-quality** — no dummy data, no hardcoded assumptions
