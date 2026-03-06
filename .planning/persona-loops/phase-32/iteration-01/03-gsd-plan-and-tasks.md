# GSD Plan & Tasks — Synthesized from Panels 1 + 2
## Phase 32 · Iteration 01

Priority order: sorted by `impact - effort` (net value), then by risk for tiebreakers.

| # | Task | Source | I | E | R | Net | GSD Command |
|---|------|--------|---|---|---|-----|-------------|
| 1 | Cache settings in `attachStrategicLens` — use page-level cache instead of re-fetching | P1-OSS | 4 | 1 | 1 | +3 | `/gsd-execute-phase 32` |
| 2 | Activity log loading state — show "Loading…" on toggle, not after fetch | P2-Execution | 3 | 1 | 1 | +2 | `/gsd-execute-phase 32` |
| 3 | Type badges in custom field dropdown (📝☑️📊) | P2-Workflow | 3 | 1 | 1 | +2 | `/gsd-execute-phase 32` |
| 4 | JSDoc API contracts for `links.ts` | P2-Knowledge | 3 | 1 | 1 | +2 | `/gsd-execute-phase 32` |
| 5 | Deduplicate select field options on save | P2-Automation | 3 | 1 | 1 | +2 | `/gsd-execute-phase 32` |
| 6 | DELETE links via query param instead of JSON body | P1-Reliability | 4 | 2 | 2 | +2 | `/gsd-execute-phase 32` |
| 7 | i18n link type labels for en/ga parity | P1-Product | 3 | 2 | 1 | +1 | `/gsd-execute-phase 32` |
| 8 | XSS prevention — eliminate innerHTML with user data | P1-Security | 5 | 3 | 3 | +2 | `/gsd-execute-phase 32` |
| 9 | Extract shared TaskSearchDropdown utility | P2-Focus | 4 | 3 | 2 | +1 | `/gsd-execute-phase 32` |
| 10 | Extract CustomFieldRenderer factory from addCFRow | P1-Platform | 3 | 3 | 3 | 0 | `/gsd-execute-phase 32` |

## Execution Plan

### Wave 1 — Quick Wins (tasks 1-5, all Effort=1)
Execute all 5 in parallel. Total time: ~30 min.

### Wave 2 — Medium (tasks 6-8, Effort 2-3)
DELETE query param, i18n labels, XSS fix. Total time: ~1.5 hours.

### Wave 3 — Refactor (tasks 9-10, Effort=3)
Search utility + renderer factory. May defer to next iteration if Wave 2 consumes budget.
