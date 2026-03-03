# GSD Plan & Tasks — Phase 57b Iteration 02

## Accepted Recommendations → Tasks

| # | Task | Source | Impact | Effort | GSD Command |
|---|------|--------|--------|--------|-------------|
| 1 | Remove dead CSS rewriter from middleware.ts | P1: Platform Architect | 3 | 1 | /gsd-execute-phase 57 |
| 2 | Use @fontsource latin-only subsets | P1: OSS Integrations | 3 | 1 | /gsd-execute-phase 57 |
| 3 | Add Cache-Control to manifest.webmanifest | P1: Reliability Eng | 3 | 1 | /gsd-execute-phase 57 |
| 4 | Create GitHub issue for 50-persona-audit deferrals | P2: Workflow Coach | 3 | 1 | /gsd-add-todo |
| 5 | Add `npm run dev:clean` script | P2: Execution Coach | 3 | 1 | /gsd-execute-phase 57 |
| 6 | Document "HA Ingress Gotchas" in INTEGRATIONS.md | P2: Knowledge Coach | 4 | 1 | /gsd-execute-phase 57 |
| 7 | Add CI check for absolute font paths in CSS | P2: Automation Coach | 4 | 1 | /gsd-execute-phase 57 |

## Execution Order
1. Task 1 (dead code removal — cleanest first)
2. Task 3 (manifest cache header)
3. Task 5 (dev:clean script)
4. Task 6 (docs)
5. Task 7 (CI check)
6. Task 4 (GitHub issue)
7. Task 2 (font subsets — test last)
