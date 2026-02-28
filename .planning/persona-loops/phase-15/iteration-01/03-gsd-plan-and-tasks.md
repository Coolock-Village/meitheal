# GSD Plan & Tasks — Phase 15 Iteration 01

## Task Backlog (Accepted Recommendations)

1. `P15-I01-T1` (P0)
- Build `board-context` client module to centralize active board state, persistence, and event dispatch.
- Trace: Frontier DDD Architect, ADHD Workflow Coach.

2. `P15-I01-T2` (P0)
- Implement keyboard-accessible Kanban move actions and ARIA announcements for status changes.
- Trace: Frontier Accessibility Engineer.

3. `P15-I01-T3` (P1)
- Harden `/api/boards` validation + standardized error response payloads.
- Trace: Frontier API Architect.

4. `P15-I01-T4` (P1)
- Consolidate task-detail hash/deep-link parser for tasks/list/kanban/table entry points.
- Trace: Frontier UX Systems Lead.

5. `P15-I01-T5` (P1)
- Replace full page reload on card move with local optimistic update + async sync.
- Trace: Frontier Performance Engineer.

6. `P15-I01-T6` (P2)
- Add compact card-field customization defaults and explicit active-board chip in page header.
- Trace: ADHD Decision Fatigue + Context Switch specialists.

## Execution Shape

- Wave 1: `T1`, `T2`, `T3`
- Wave 2: `T4`, `T5`, `T6`

## Validation Targets

- `npx pnpm check`
- `npx pnpm --filter @meitheal/tests test`
- Targeted a11y keyboard flow checks on Kanban/task detail
- `npx pnpm --filter @meitheal/web perf:budget`
