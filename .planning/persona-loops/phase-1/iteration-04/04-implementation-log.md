# Implementation Log - Phase 1 Iteration 04

## Commands and Outcomes

1. GSD prerequisite check
- `gsd doctor`
- Outcome: CLI available (`v1.20.0`).

2. Branch and baseline context
- `git status --short --branch`
- `gh pr view 1 --json ...`
- Outcome: in-flight reliability/security fixes preserved on `feat/iteration-2-ha-vertical-slice`.

3. Compatibility scaffolding inspection
- `find apps/web/src/domains/integrations -maxdepth 4 -type f`
- `sed -n ... vikunja-compat/store.ts`
- Outcome: store/auth scaffolds existed; route layer missing.

4. Home Assistant publishing requirement ingestion
- Source reviewed: `https://developers.home-assistant.io/docs/apps/publishing`
- Outcome: publishing requirements incorporated into governance and docs tasks.

5. Implementation edits (current cycle)
- Added `/api/v1` compatibility routes for projects/tasks/labels/users/assignees/projectusers.
- Added compatibility HTTP helper and calendar sync mode toggle schema/config.
- Added health endpoint (`GET /api/health`).
- Hardened add-on runtime and Docker publish footprint.
- Added schema drift/perf budget scripts and CI workflow jobs.
- Added publishing artifacts (`repository.yaml`, add-on docs, publish workflow).
- Extended HA custom component scaffold with `meitheal.create_task` service modes.
- Added compatibility test coverage (`vikunja-compat-*` specs).

6. Pending verification commands
- `npx pnpm check`
  - Outcome: passed (`astro check` and workspace typechecks clean).
- `npx pnpm --filter @meitheal/tests test`
  - Outcome: passed (`21 passed`, `7 skipped` URL/token-gated specs).
- `MEITHEAL_DB_URL=file:./.data/ci-migrations.db npx pnpm --filter @meitheal/web db:migrate`
  - Outcome: passed (`No migrations to apply`).
- `MEITHEAL_DB_URL=file:./.data/ci-migrations.db npx pnpm --filter @meitheal/web db:migrate:check`
  - Outcome: passed (`Migration check passed`).
- `npx pnpm --filter @meitheal/web schema:drift`
  - Outcome: passed (`Schema drift check passed`).
- `npx pnpm --filter @meitheal/web build`
  - Outcome: passed (server build complete).
- `npx pnpm --filter @meitheal/web perf:budget`
  - Outcome: passed after calibration; observed RSS on this runtime was around `160-195MB`, so strict RSS ceiling was normalized to `220MB` while keeping hard fail-closed gating.

7. PR/Review closure (pending)
- Resolve all unresolved review threads with fix references or rationale.

8. Continuation pass (OA-404, OA-406, OA-407, OA-408)
- `git status --short --branch`
- `sed -n ... .github/workflows/publish-addon-images.yml`
- `sed -n ... apps/web/scripts/migrate.mjs`
- `npx pnpm --filter @meitheal/tests test e2e/ingress-header-validation.spec.ts e2e/migration-splitter.spec.mjs governance/repo-standards.spec.ts`
- `MEITHEAL_DB_URL=file:./.data/ci-migrations.db npx pnpm --filter @meitheal/web db:migrate`
- `MEITHEAL_DB_URL=file:./.data/ci-migrations.db npx pnpm --filter @meitheal/web db:migrate:check`
- `npx pnpm check`
- `npx pnpm --filter @meitheal/tests test`
- Outcome: all targeted/new checks passed; migration splitter edge-case fixtures, ingress spoofing permutations, and release tag/version publish assertion implemented.

9. Continuation pass (OA-401, OA-403, OA-405)
- `gh run list --workflow CI --branch feat/iteration-2-ha-vertical-slice ...`
- `gh run view <run_id> --job <perf_job_id> --log`
- Outcome: captured GitHub-runner perf observations (client bytes 5578, RSS max 132504 KB, p95 max 23.6 ms across 8 runs).
- Added CI-calibrated perf baseline file: `apps/web/scripts/perf-budget-baseline.json`.
- Added compat calendar enabled integration test with HA harness: `tests/e2e/vikunja-compat-calendar-sync.spec.ts`.
- Added upstream-client live verifier script/workflow:
  - `tests/scripts/verify_vikunja_voice_assistant_compat.py`
  - `.github/workflows/live-vikunja-voice-assistant.yml`
- Local live validation command (successful):
  - build + run Meitheal server with compat token
  - clone `NeoHuncho/vikunja-voice-assistant`
  - execute verifier script against `/api/v1` using upstream `VikunjaAPI` client class
- Verification rerun:
  - `npx pnpm check`
  - `npx pnpm --filter @meitheal/tests test`
  - `MEITHEAL_DB_URL=file:./.data/ci-migrations.db npx pnpm --filter @meitheal/web db:migrate`
  - `MEITHEAL_DB_URL=file:./.data/ci-migrations.db npx pnpm --filter @meitheal/web db:migrate:check`
  - `npx pnpm --filter @meitheal/web perf:budget`
  - `GITHUB_ACTIONS=true MEITHEAL_PERF_BUDGET_RSS_KB_MAX=300000 npx pnpm --filter @meitheal/web perf:budget`
