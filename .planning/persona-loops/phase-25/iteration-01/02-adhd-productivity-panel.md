# ADHD/Productivity Panel — Phase 25 Production Polish

## Objective

Review cognitive load, process friction, and automation opportunities across the Meitheal development workflow.

| Persona | Recommendation | Impact | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Workflow Coach | Add a `CONTRIBUTING.md` file to the repo root with setup instructions, branch naming, commit conventions, and PR process. Currently a new contributor must read multiple `.planning/` files to orient themselves. | 3 | 1 | 1 | ✅ Accept |
| Execution Coach | Add `--coverage` flag to the Playwright test command in `tests/package.json` to track test coverage metrics. Currently 103 tests exist but no coverage measurement. | 3 | 1 | 1 | ✅ Accept |
| Knowledge Coach | Update `docs/kcs/operations-runbook.md` with Phase 23-24 additions: IDB attachment store schema, perf-budget-baseline.json tuning process, and the Blob URL lightbox pattern. | 3 | 2 | 1 | ✅ Accept |
| Focus Optimizer | The current persona loop should focus exclusively on actionable code changes. Do not expand scope to include Obsidian sync, Electron apps, or other Phase 5+ deferred items. | 0 | 0 | 0 | Already correct |
| Automation Coach | Add a `pre-commit` git hook (via `.husky/`) that runs `pnpm check` before allowing commits, preventing type errors from reaching CI. | 3 | 2 | 1 | ✅ Accept |
