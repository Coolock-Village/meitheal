# Frontier Panel - Phase 1 Iteration 03

## Objective

Close the highest-leverage optimization gaps from Iteration 02: production runtime startup, migration command path, and HA integration CI harness.

| Persona | Recommendation | Impact (1-5) | Effort (1-5) | Risk (1-5) | Decision |
| --- | --- | --- | --- | --- | --- |
| Platform Engineer | Replace add-on dev server runtime with production `node dist/server/entry.mjs`. | 5 | 3 | 4 | Accept |
| Data Engineer | Add explicit migration command path and migration files under `apps/web/drizzle/migrations`. | 4 | 3 | 3 | Accept |
| QA/CI Engineer | Add dedicated HA adapter harness test and CI job for deterministic integration checks. | 4 | 3 | 4 | Accept |
| Security Engineer | Keep SSRF and token-redaction controls intact while changing runtime paths. | 4 | 2 | 3 | Accept |
| Release Engineer | Update branch protection required checks to include new CI jobs. | 4 | 1 | 2 | Accept |

## Rejected/Deferred

- Full live Home Assistant containerized E2E in CI deferred due infra cost/complexity.
