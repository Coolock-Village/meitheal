# GSD Plan and Tasks - Phase 1 Iteration 01

## Objective
Gamification + Labels Gap Analysis and Sprint Planning

## Synthesized Tasks (from Panels 1 + 2)

| # | Task | Source | GSD Command | Priority |
|---|------|--------|-------------|----------|
| 1 | Create `domains/labels/` bounded context with `LabelStore` service layer wrapping existing label logic | Product Architect (P1) | `/gsd-plan-phase 1` | P1 |
| 2 | Create `label-color-resolver.ts` utility for deterministic label → color mapping | Automation Coach (P2) | `/gsd-plan-phase 1` | P1 |
| 3 | Extract `LabelBadges.astro` component from inline kanban rendering | Workflow Coach (P2) | `/gsd-plan-phase 1` | P1 |
| 4 | Extract `LabelPicker.astro` component using existing CSS classes | Workflow Coach (P2) | `/gsd-plan-phase 1` | P1 |
| 5 | Add E2E test for label badge rendering on kanban cards (regression baseline) | Execution Coach (P2) | `/gsd-plan-phase 1` | P1 |
| 6 | Integrate `LabelBadges` on Today, Upcoming, Table views | LBL-03/04/05 | `/gsd-plan-phase 1` | P2 |
| 7 | Use CSS-only confetti animation (no external lib) | OSS Integrations (P1) | `/gsd-plan-phase 4` | P2 |
| 8 | Add E2E tests for label CRUD API (`PUT`, `DELETE`) | Reliability Engineer (P1) | `/gsd-plan-phase 2` | P1 |
| 9 | Sanitize label titles + validate hex_color on rename path | Security Engineer (P1) | `/gsd-plan-phase 2` | P1 |
| 10 | Add KCS inline comments in `LabelPicker.astro` | Knowledge Coach (P2) | `/gsd-plan-phase 1` | P3 |

## Deferred to Backlog

| Task | Source | Trigger |
|------|--------|---------|
| Unify dual label storage behind `LabelRepository` | Platform Architect (P1) | After Phase 3 completion, if inconsistency causes maintenance issues |

## Execution Order

**Wave 1 (Foundation):** Tasks 1, 2 — domain + utility
**Wave 2 (Components):** Tasks 3, 4, 5 — extract + test
**Wave 3 (Integration):** Task 6 — render across views
