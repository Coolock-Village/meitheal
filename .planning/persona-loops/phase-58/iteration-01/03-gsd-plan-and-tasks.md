# GSD Plan & Tasks — Phase 58 Iteration 01
## Design & UX Audit

## Accepted Recommendations → Tasks

| # | Task | Source | Impact | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 1 | Fix Upcoming page "Offline" — add to SW precache/network-first | P1: Product Architect | 5 | 2 | P0 — broken page |
| 2 | Add `+ New Task` button to Dashboard header | P2: Platform Architect | 3 | 1 | P1 |
| 3 | Replace integration progress bars with status badges | P3: OSS Integrations | 3 | 2 | P2 |
| 4 | Default HA drawer to collapsed, persist in localStorage | P7: Execution Coach | 3 | 1 | P1 |
| 5 | Update Dashboard Quick Add placeholder with examples | P8: Knowledge Coach | 2 | 1 | P2 |
| 6 | Support `/settings#tab` hash-based tab selection | P9: Focus Optimizer | 3 | 1 | P1 |
| 7 | Add confirmation to "Raw DB" download button | P5: Security Engineer | 2 | 1 | P2 |

## Deferred (Phase 59)

| # | Task | Source | Rationale |
|---|------|--------|-----------|
| D1 | Consolidate sidebar nav (Tasks/Table → unified views) | P6: Workflow Coach | Cross-cutting: sidebar config, routing, settings |
| D2 | Skeleton loading states for Dashboard | P4: Reliability Eng | Impact threshold not met |
| D3 | First-visit keyboard shortcuts toast | P10: Automation Coach | Nice-to-have, effort matches impact |

## Execution Order

1. Task 1 — SW fix (P0, broken functionality)
2. Task 4 — HA drawer default (quick win, visible improvement)
3. Task 2 — Dashboard +New Task (quick win)
4. Task 5 — Quick Add placeholder (trivial)
5. Task 6 — Settings hash tabs (quick win)
6. Task 7 — Raw DB confirmation (safety)
7. Task 3 — Integration status badges (visual rework)
