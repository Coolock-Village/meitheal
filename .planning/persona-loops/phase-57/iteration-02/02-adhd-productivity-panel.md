# Panel 2: ADHD/Productivity — Phase 57b Iteration 02

## Workflow Coach
**Recommendation:** The`.planning/persona-loops/50-persona-audit.md` has 10 ⚠️ Med items all deferred to "Phase 5" but no Phase 5 backlog issue exists. Create a GitHub issue to capture these so they don't drift out of awareness.
- Impact: 3 | Effort: 1 | Risk: 1
- Success: GitHub issue exists linking all 10 deferred items with their persona numbers.
- **Decision: Accept**

## Execution Coach
**Recommendation:** The dev server restart dance (kill old PID, clear cache, restart, check port) took 5+ tool calls in this session. Add a `npm run dev:clean` script that kills existing processes and restarts with clean Vite cache.
- Impact: 3 | Effort: 1 | Risk: 1
- Success: `npm run dev:clean` exists and does `rm -rf node_modules/.vite .astro && astro dev --port 4500`.
- **Decision: Accept**

## Knowledge Coach
**Recommendation:** Document the font path fix in `.planning/codebase/INTEGRATIONS.md` under a "Known HA Ingress Gotchas" section. The pattern (static assets bypass middleware → need build-time path fixes) will recur with any new static assets.
- Impact: 4 | Effort: 1 | Risk: 1
- Success: INTEGRATIONS.md has a "HA Ingress Gotchas" section explaining static asset path rewriting.
- **Decision: Accept**

## Focus Optimizer
**Recommendation:** This iteration had clear scope (3 production bugs) and stayed focused. No change needed — continue single-concern iterations.
- Impact: 1 | Effort: 0 | Risk: 0
- Success: N/A
- **Decision: Reject** — no actionable change.

## Automation Coach
**Recommendation:** Add a build-time check (CI job step) that greps for `url(/_astro/` in CSS output and fails if found. Prevents font regressions if someone changes the Vite config.
- Impact: 4 | Effort: 1 | Risk: 1
- Success: CI fails if any CSS file has absolute `/_astro/` font paths.
- **Decision: Accept**
