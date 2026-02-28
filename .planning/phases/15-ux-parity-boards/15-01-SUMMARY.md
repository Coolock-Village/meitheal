# Summary 15-01: UX Parity and Board Domain Separation

## Objective

Establish board-domain separation and improve task/card UX parity for core task views.

## Delivered Changes

1. Added board domain persistence and task-board linkage (`boards` table and `board_id` behavior).
2. Implemented board API endpoints and sidebar board switcher integration.
3. Added board-aware rendering/filter behavior and fixed regressions in tasks/table/kanban.
4. Improved RICE filtering and deep-link pathways in list/table surfaces.

## Verification Evidence

1. Commit evidence
- `570ce89` added board persistence/API work and board switcher wiring (`store.ts`, `api/boards/*`, `Layout.astro`, task API files).
- `1b50581` added RICE filtering and deep-link/SSR sweep updates in `tasks.astro` and `table.astro`.
- `ff8fba6` fixed board-filtering/custom-field rendering regressions in `Layout.astro`, `kanban.astro`, `table.astro`, `tasks.astro`.

2. Planning evidence
- `15-CONTEXT.md` documents phase boundary and delivered/remaining decisions.
- `phase-15/iteration-01` persona loop artifacts define accepted optimization actions and mapped tasks.

## Risk/Regression Notes

1. Board state is still partly distributed between layout/page scripts and should be consolidated in future execution waves.
2. Kanban drag/drop remains partly mouse-centric; keyboard parity remains a tracked optimization action.

## Confidence

high

## Evidence Gaps

1. No dedicated phase-local implementation log with command output under `.planning/phases/15-*`; evidence is commit/persona-loop based.
