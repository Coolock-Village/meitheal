# GSD Plan and Tasks - Phase 1 Iteration 04

## Accepted Recommendations to Tasks

1. T-401 Compatibility route surface
- Scope: implement `/api/v1` endpoint subset for projects/tasks/labels/users/assignees/projectusers.
- Acceptance: voice-assistant protocol flow passes in compat E2E sequence.
- Sources: P01, P04, P13, P14, P23, P27, P33, P38.

1. T-402 Compatibility persistence and DDD isolation
- Scope: maintain compatibility metadata tables, keep domain boundaries clean, avoid cross-layer leakage.
- Acceptance: compat store tests pass and no domain package imports integration-layer contracts.
- Sources: P03, P05, P12, P28, P42, P46.

1. T-403 Env-only compatibility auth
- Scope: enforce bearer auth from env vars only (`MEITHEAL_VIKUNJA_API_TOKEN(S)`).
- Acceptance: auth tests cover 503/401/success behavior.
- Sources: P19.

1. T-404 Compatibility calendar sync mode toggle
- Scope: add `compatibility.vikunja_api.calendar_sync_mode` with `disabled|enabled`, default disabled.
- Acceptance: compat create path respects mode and remains deterministic.
- Sources: P29, P45.

1. T-405 Meitheal-native HA service scaffold
- Scope: expose `meitheal.create_task` with `native` and `vikunja_compat` modes.
- Acceptance: component docs/services metadata updated and scaffold registers service.
- Sources: P21, P22, P37, P39.

1. T-406 Migration hardening
- Scope: robust SQL statement splitter, transaction API usage, guaranteed client close.
- Acceptance: migration check path still passes and script handles quoted semicolons/comments safely.
- Sources: P15, P49.

1. T-407 Startup diagnostics and health
- Scope: add `/api/health`, explicit migration-failure logging, startup probe diagnostics.
- Acceptance: add-on logs expose startup state and health endpoint returns DB-ready status.
- Sources: P02, P09.

1. T-408 Schema drift gate
- Scope: add CI schema drift script and required workflow job.
- Acceptance: job fails on missing tables/columns required by runtime schema.
- Sources: P11, P50.

1. T-409 Baseline-strict perf budgets
- Scope: enforce bundle/RSS/p95 budgets in CI.
- Acceptance: CI job fails closed when thresholds are exceeded.
- Sources: P17, P41.

1. T-410 Optional live-HA verification
- Scope: `workflow_dispatch` path for live Home Assistant API + calendar probe.
- Acceptance: manual workflow accepts HA URL/entity input and secret token.
- Sources: P09.

1. T-411 Publishing and governance alignment
- Scope: integrate Home Assistant publishing requirements in docs and required files.
- Acceptance: `repository.yaml`, add-on docs, image contract, governance tests updated.
- Sources: P18, P25, P26, P34, P35, P36, P48.

1. T-412 Security hardening closure
- Scope: preserve ingress/auth checks, unknown-task 404 behavior, SSRF hardening.
- Acceptance: tests and manual checks validate no regressions.
- Sources: P07, P08, P20, P40.

1. T-413 Observability parity
- Scope: compatibility operations emit queryable logs/audit correlation fields.
- Acceptance: logging/operations docs updated and no redaction regressions.
- Sources: P10, P30, P43, P44, P47.

1. T-414 Review-thread closure and verification
- Scope: resolve open Codex/CodeRabbit threads with fix references.
- Acceptance: open review threads reduced to zero unresolved blockers.
- Sources: P16, P31, P50.

1. T-415 Iteration hygiene/docs lint
- Scope: complete iteration-04 artifact set and fix markdown lint issues in carried docs.
- Acceptance: all 7 iteration files present, non-empty, and style-consistent.
- Sources: ADHD panel and deferred design notes.
