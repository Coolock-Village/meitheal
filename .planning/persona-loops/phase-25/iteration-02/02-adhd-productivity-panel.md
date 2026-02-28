# ADHD/Productivity Panel — Phase 25 Iteration 02

## Objective

Fresh review of cognitive load, process friction, and automation gaps.

| Persona | Recommendation | Impact | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Workflow Coach | The test suite has 103 tests but the test output doesn't show which test files contribute to the count. Add a `--reporter=verbose` flag to Playwright config so each test file's contribution is visible. | 2 | 1 | 1 | ✅ Accept |
| Execution Coach | The `perf-budget-check.mjs` script silently exits 0 even when NO dist directory exists. Add a check for the dist directory existence at the top of the script. | 3 | 1 | 1 | ✅ Accept |
| Knowledge Coach | `docs/kcs/operations-runbook.md` has no section for the IDB schema upgrade process (V1→V2). Add a "Database Migrations" section documenting how `offline-store.ts` handles `onupgradeneeded`. | 3 | 1 | 1 | ✅ Accept |
| Focus Optimizer | The iteration scope is correctly focused on code-level fixes. No scope expansion needed. | 0 | 0 | 0 | Already correct |
| Automation Coach | Add a `pnpm build && node perf-budget-check.mjs` composite script as `perf:check` in apps/web/package.json so the full CI pipeline can be reproduced locally with a single command. | 2 | 1 | 1 | ✅ Accept |
