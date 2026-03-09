# Meitheal — Gamification + Labels Feature Sprint

## What This Is

Meitheal is a Home Assistant add-on for task/project management. This sprint focuses on **completing the Labels system** and **introducing Gamification** — two feature domains identified by gap analysis as the highest-impact additions to reach competitive parity with Todoist, Habitica, Vikunja, and Super Productivity.

## Core Value

Make task management more engaging (gamification) and more organizable (labels) while maintaining Astro-first architecture and HA Supervisor compatibility.

## Current State

- **183 files**, ~24.5k lines (TypeScript + Astro)
- **274 passing E2E tests**
- **Build passes**, typecheck clean (0 errors)
- Labels ~60% implemented (back-end strong, front-end incomplete)
- Gamification 0% implemented

## Sprint Goals

1. **Labels Completion** — Extract reusable `LabelPicker` and `LabelBadges` components, add filter bar, label management UI, CRUD API, render labels across all views
2. **Gamification Foundation** — Define new DDD bounded context (`domains/gamification/`), implement streaks, completion celebrations, daily goals, progress visualization
3. **Parity** — Close competitive gaps against Todoist (karma/streaks), Habitica (XP/badges), Vikunja (label management)

## Tech Stack

- Astro SSR (Node adapter) inside Home Assistant Supervisor
- SQLite + Drizzle ORM
- TypeScript strict mode
- Monorepo with pnpm workspaces

## Constraints

- **Astro-native/first** — no React, no SPA patterns
- **HA Supervisor ingress** — all URLs must be ingress-aware
- **Zero regressions** — all 274 E2E tests must pass after each phase
- **DDD boundaries** — labels and gamification as separate bounded contexts
- **KCS** — all new features documented inline with behavior changes
