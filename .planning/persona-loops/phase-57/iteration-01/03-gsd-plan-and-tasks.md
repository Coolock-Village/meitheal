# GSD Plan & Tasks — Phase 57: UI/UX + HA Optimization

**Phase:** 57 — UI/UX Polish Wave + HA Deep Integration
**Iteration:** 01
**Date:** 2026-03-04

---

## Accepted Tasks (Priority Order)

### Quick Wins (Effort ≤ 1)

| # | Task | Source | GSD Command | Effort |
|---|------|--------|-------------|--------|
| 1 | Add CSS brace-balance governance test to CI | Frontier #3 | `/gsd-execute-phase` | 1 |
| 2 | Add `data-astro-prefetch="hover"` to sidebar nav links | ADHD #4 | `/gsd-execute-phase` | 1 |
| 3 | Persist sidebar collapsed state in `localStorage` | ADHD #5 | `/gsd-execute-phase` | 1 |
| 4 | Add `title` tooltips to dashboard stat cards | ADHD #3 | `/gsd-execute-phase` | 1 |
| 5 | Validate CSP `style-src` against Astro scoped styles | Frontier #4 | `/gsd-verify-phase` | 1 |

### Medium Effort (Effort 2-3)

| # | Task | Source | GSD Command | Effort |
|---|------|--------|-------------|--------|
| 6 | HA theme variable CSS passthrough (ingress detection) | Frontier #2 | `/gsd-execute-phase` | 2 |
| 7 | Keyboard shortcuts: `n` (new), `/` (search), `k` (kanban) | ADHD #2 | `/gsd-execute-phase` | 2 |
| 8 | CSS-only loading indicator for page transitions behind ingress | ADHD #1 | `/gsd-execute-phase` | 2 |
| 9 | User-configurable accent color in Settings → General | Frontier #5 | `/gsd-plan-phase` first | 3 |

### Deferred

| # | Task | Source | Reason |
|---|------|--------|--------|
| D1 | Split `global.css` into domain-scoped Astro component styles | Frontier #1 | High effort (4), needs dedicated phase |

---

## Execution Order

1. **Batch 1** (Tasks 1-5): All quick wins, can be done in parallel
2. **Batch 2** (Tasks 6-8): Medium effort, sequential
3. **Batch 3** (Task 9): Requires plan-phase first (DB schema change for accent color)

---

## Implementation Notes

- Tasks 1-5 are leaf changes — no cross-cutting dependencies
- Task 6 (HA theme) should be validated in HA devcontainer
- Task 7 (shortcuts) needs input field exclusion logic
- Task 9 depends on Task 6 (accent color inherits from HA theme as default)
