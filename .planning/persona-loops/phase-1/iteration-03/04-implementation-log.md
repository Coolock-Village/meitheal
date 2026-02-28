# Implementation Log - Phase 1 Iteration 03

## Commands and Outcomes

1. Preconditions
- `gsd doctor`
- Outcome: GSD CLI available (`v1.20.0`).

2. Production add-on runtime
- Updated `addons/meitheal-hub/Dockerfile` to run web build in image build step.
- Updated `addons/meitheal-hub/run.sh` to execute `db:migrate` then `node dist/server/entry.mjs`.
- Outcome: add-on path no longer depends on `pnpm run dev`.

3. Migration command path
- Added `apps/web/scripts/migrate.mjs`.
- Added migration `apps/web/drizzle/migrations/0000_iteration2_init.sql`.
- Added scripts in `apps/web/package.json`: `db:migrate`, `db:migrate:check`.
- Verified:
  - `MEITHEAL_DB_URL=file:./.data/local-migrate-check.db npx pnpm --filter @meitheal/web db:migrate`
  - `MEITHEAL_DB_URL=file:./.data/local-migrate-check.db npx pnpm --filter @meitheal/web db:migrate:check`

4. HA harness CI
- Added `tests/e2e/ha-calendar-adapter.spec.ts`.
- Added CI jobs: `ha-harness`, `migration-check`.
- Outcome: deterministic adapter-level integration checks in CI.

5. Governance alignment
- Updated main branch protection required checks to include:
  - `governance`
  - `typecheck-and-tests`
  - `ha-harness`
  - `migration-check`

6. Verification
- `npx pnpm check`
- `npx pnpm test`
- Outcome: passing checks/tests; URL-driven browser tests remain intentionally skipped without `E2E_BASE_URL`.
