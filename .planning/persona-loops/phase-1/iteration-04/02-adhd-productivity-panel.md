# ADHD/Productivity Panel - Phase 1 Iteration 04

## Objective

Reduce execution thrash by batching work into reliability/docs, compatibility feature set, and CI/governance closures with explicit stop conditions.

| Persona | Recommendation | Impact (1-5) | Effort (1-5) | Risk (1-5) | Decision | Mapped Task ID |
| --- | --- | --- | --- | --- | --- | --- |
| Focus Coach | Sequence work in strict batches: fix blockers, add compat routes, then CI gates/docs. | 5 | 1 | 2 | Accept | T-414 |
| Workflow Coach | Keep one source-of-truth checklist in iteration-04 `03-gsd-plan-and-tasks.md`. | 4 | 1 | 2 | Accept | T-415 |
| Automation Coach | Convert recurring checks to scripts (`schema:drift`, `perf:budget`) rather than manual inspection. | 5 | 2 | 3 | Accept | T-408 |
| Triage Coach | Close review threads only after verification matrix passes locally. | 4 | 1 | 3 | Accept | T-414 |
| Documentation Coach | Update README/runbooks in same commits as behavior changes to prevent stale docs. | 5 | 1 | 2 | Accept | T-411 |

## Capture/Triage/Follow-through Improvements

1. Every accepted action from the 50-persona table is mapped to a stable task ID.
2. Verification commands are logged in `04-implementation-log.md` as soon as they run.
3. Cycle decision is based on open high-leverage/high-risk actions, not subjective completeness.
