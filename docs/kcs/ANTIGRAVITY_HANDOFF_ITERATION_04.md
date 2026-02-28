# Antigravity Handoff - Iteration 04

Last updated: 2026-02-28 (Europe/Dublin)

## Repository State

- Repo: `Coolock-Village/meitheal`
- Branch: `feat/iteration-2-ha-vertical-slice`
- PR: `https://github.com/Coolock-Village/meitheal/pull/1`
- Local/remote sync: clean and up to date at handoff creation time.

Latest commits:

1. `667fd12` docs: fix remaining markdown heading spacing in iteration-02 artifacts
2. `c2d1750` feat: deliver pre-iteration-4 compatibility, ops hardening, and CI gates
3. `813884b` chore: continue persona loop with production runtime and migration harness

## What Is Implemented

1. Compatibility API surface implemented and token-gated:
- `/api/v1/projects`
- `/api/v1/projects/{id}/projectusers`
- `/api/v1/projects/{id}/tasks`
- `/api/v1/labels` (`GET`/`PUT`)
- `/api/v1/users`
- `/api/v1/tasks/{id}/labels`
- `/api/v1/tasks/{id}/assignees`

2. Compatibility auth is env-only:
- `MEITHEAL_VIKUNJA_API_TOKEN`
- `MEITHEAL_VIKUNJA_API_TOKENS`

3. Compatibility calendar behavior is config-gated:
- `compatibility.vikunja_api.calendar_sync_mode: disabled|enabled`
- default is `disabled`.

4. Add-on/runtime hardening:
- startup migration failure reporting
- health endpoint: `GET /api/health`
- Docker install/build/prune flow improved.

5. CI gates expanded:
- `schema-drift` (required)
- `perf-budgets` (required)
- existing governance, typecheck/tests, ha-harness, migration-check remain.

6. Home Assistant publishing requirements integrated:
- root `repository.yaml`
- add-on `config.yaml` includes image contract with `{arch}`
- add-on `README.md` and `DOCS.md`
- publishing workflow `publish-addon-images.yml`
- optional live verification workflow `live-ha-integration.yml`
- KCS checklist: `docs/kcs/ha-publishing-checklist.md`.

7. Iteration-04 persona loop artifacts completed:
- `.planning/persona-loops/phase-1/iteration-04/01..07`.

## Validation Snapshot

Local validations passed during this cycle:

1. `npx pnpm check`
2. `npx pnpm --filter @meitheal/tests test`
3. `db:migrate`, `db:migrate:check`
4. `schema:drift`
5. `build`
6. `perf:budget`

PR checks currently reported green for required jobs, but PR remains blocked by normal review policy (`reviewDecision: REVIEW_REQUIRED`).

## Known Decisions and Constraints

1. Astro-first/native and HA-first remain non-negotiable.
2. Compatibility remains protocol-level only (no external code copy).
3. Secrets must remain env-based, not YAML-stored.
4. Perf budget is enforced fail-closed with current thresholds:
- client <= 80KB
- RSS <= 220MB
- p95 task create <= 250ms.

## Open TODOs (Priority Order)

From iteration-04 optimization actions:

1. `OA-401` Validate `/api/v1` against live `vikunja-voice-assistant`.
2. `OA-405` Add integration test for `calendar_sync_mode=enabled` compatibility path.
3. `OA-403` Recalibrate perf thresholds using GitHub runner historical data.
4. `OA-409` Add compatibility dashboard panels.
5. `OA-410` Validate live-HA workflow across non-UTC calendars.
6. `OA-411` Improve custom component error payload UX.
7. `OA-412` Draft iteration-05 integrations RFC (Grocy/Node-RED/n8n deeper adapters).

## Continuation Update (2026-02-28)

Completed in the continuation pass:

1. `OA-404` publish workflow now hard-fails when release tag does not match `addons/meitheal-hub/config.yaml` version (`v<version>` check).
2. `OA-406` ingress spoofing permutation coverage added (`tests/e2e/ingress-header-validation.spec.ts`).
3. `OA-407` migration splitter edge-case fixtures added (`tests/e2e/migration-splitter.spec.mjs`), splitter extracted to `apps/web/scripts/split-sql-statements.mjs`.
4. `OA-408` governance test added for `repository.yaml` semantic fields and maintainer format.

Validation rerun after continuation edits:

1. `npx pnpm check` (pass)
2. `npx pnpm --filter @meitheal/tests test` (pass)
3. `npx pnpm --filter @meitheal/tests test e2e/ingress-header-validation.spec.ts e2e/migration-splitter.spec.mjs governance/repo-standards.spec.ts` (pass)
4. `MEITHEAL_DB_URL=file:./.data/ci-migrations.db npx pnpm --filter @meitheal/web db:migrate` (pass)
5. `MEITHEAL_DB_URL=file:./.data/ci-migrations.db npx pnpm --filter @meitheal/web db:migrate:check` (pass)

## Recommended Next Operator Steps

1. Pull latest branch and inspect PR #1 check runs.
2. Run live `vikunja-voice-assistant` against Meitheal compat endpoints.
3. Execute live HA workflow with `HA_TOKEN` secret and real calendar entity.
4. Close out top 3 TODOs (`OA-401`, `OA-405`, `OA-403`) before merge.

## Copy/Paste Brief for Antigravity

```
Context: continue from PR #1 on branch feat/iteration-2-ha-vertical-slice in Coolock-Village/meitheal.
Read docs/kcs/ANTIGRAVITY_HANDOFF_ITERATION_04.md first.
Primary objective: complete open optimization actions OA-401/OA-405/OA-403 with CI-safe changes.
Keep Astro-first/native, env-only token auth, DDD boundaries, and HA publishing contract intact.
Do not regress existing required checks: governance, typecheck-and-tests, ha-harness, migration-check, schema-drift, perf-budgets.
```
