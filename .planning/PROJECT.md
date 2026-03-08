# Meitheal — Codebase Hardening Sprint

## What This Is

Meitheal is a Home Assistant add-on for task/project management. This sprint focuses on **internal code quality hardening** — not new features. It addresses the 10 prioritized action items from the [50-persona codebase quality audit](persona-loops/codebase-quality-audit/50-persona-audit.md).

## Core Value

Improve reliability, performance, maintainability, and DDD compliance of the existing codebase without changing user-facing behavior.

## Current State

- **183 files**, ~24.5k lines (TypeScript + Astro)
- **274 passing E2E tests**
- **Build passes**, typecheck clean (0 errors)
- Phase 1 quick wins already done: WAL mode, composite index, reconnect guard, sentReminders eviction

## Sprint Goals

1. **Unify** — Extract `TaskRepository`, `TaskApiClient`, shared components
2. **Harden** — Audit 226 silent catches, add structured logging
3. **Optimize** — Batch SQL queries, extract client scripts, bulk API
4. **Organize** — Decompose monolith pages, enforce DDD boundaries

## Tech Stack

- Astro SSR (Node adapter) inside Home Assistant Supervisor
- SQLite + Drizzle ORM
- TypeScript strict mode
- Monorepo with pnpm workspaces

## Constraints

- **Astro-native/first** — no React, no SPA patterns
- **HA Supervisor ingress** — all URLs must be ingress-aware
- **Zero regressions** — all 274 E2E tests must pass after each phase
- **No behavior changes** — pure refactoring, no feature additions
