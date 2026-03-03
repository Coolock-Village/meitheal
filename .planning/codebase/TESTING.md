# Testing Patterns

**Analysis Date:** 2026-03-03
**Version:** 0.2.6

## Framework

- **Runner:** Playwright 1.58
- **Config:** `tests/playwright.config.ts`
- **Assertion:** Playwright built-in `expect`

## Commands

```bash
pnpm --filter @meitheal/tests test          # All tests
pnpm --filter @meitheal/tests test <file>   # Specific spec
pnpm check                                  # Typecheck all packages
```

## Test Inventory (38 specs)

| Spec | Type | Status |
|------|------|--------|
| `ha-calendar-adapter.spec.ts` | Integration | ✅ Active (3 tests) |
| `task-sync-persistence.spec.ts` | Integration | ✅ Active (4 tests) |
| `task-sync-domain.spec.ts` | Unit | ✅ Active (2 tests) |
| `vikunja-compat-auth.spec.ts` | Unit | ✅ Active (3 tests) |
| `vikunja-compat-calendar-sync.spec.ts` | Integration | ✅ Active (1 test) |
| `vikunja-compat-calendar-timezone.spec.ts` | Integration | ✅ Active (3 tests) |
| `ingress-header-validation.spec.ts` | Unit | ✅ Active (4 tests) |
| `logger-redaction.spec.ts` | Unit | ✅ Active (1 test) |
| `migration-splitter.spec.mjs` | Unit | ✅ Active (3 tests) |
| `ha-security-hardening.spec.ts` | Security | ✅ Active |
| `middleware-ingress-behavior.spec.ts` | Integration | ✅ Active |
| `rename-sweep-regression.spec.ts` | Regression | ✅ Active |
| `layout-ingress-viewtransitions.spec.ts` | Integration | ✅ Active |
| `vikunja-compat.spec.ts` | E2E | ⏭ Skipped (requires running server) |
| `well-known.spec.ts` | E2E | ⏭ Skipped (requires running server) |
| `pages.spec.ts` | E2E | ⏭ Skipped (requires E2E_BASE_URL) |
| `navigation.spec.ts` | E2E | ⏭ Skipped (requires E2E_BASE_URL) |
| `seo.spec.ts` | E2E | ⏭ Skipped (requires E2E_BASE_URL) |
| `accessibility.spec.ts` | E2E | ⏭ Skipped (requires E2E_BASE_URL) |
| `security-headers.spec.ts` | Placeholder | ⏭ Skipped |
| `auth-passkey.spec.ts` | Placeholder | ⏭ Skipped |
| `offline-sync.spec.ts` | Placeholder | ⏭ Skipped |
| `integrations.spec.ts` | Placeholder | ⏭ Skipped |
| `logging-observability.spec.ts` | Placeholder | ⏭ Skipped |
| `api.spec.ts` | Placeholder | ⏭ Skipped |
| `repo-standards.spec.ts` | Governance | ✅ Active (4 tests) |
| + 12 additional specs | Various | ✅/⏭ (see `tests/e2e/`) |

**Totals:** 38 specs total

## CI Jobs

| Job | Tests Run |
|-----|-----------|
| `typecheck-and-tests` | All specs |
| `ha-harness` | `ha-calendar-adapter.spec.ts` |
| `governance` | `repo-standards.spec.ts` |
| `migration-check` | `db:migrate` + `db:migrate:check` |
| `schema-drift` | `schema:drift` |
| `perf-budgets` | `perf:budget` (custom script) |

## Patterns

- Tests import domain logic directly from workspace packages
- HA tests use local HTTP server harness to simulate HA API
- Persistence tests use temp SQLite file (`file:${tmpdir}/...`)
- No shared state between specs
- No external mocking framework — pure HTTP stubbing

---

*Testing analysis: 2026-03-03 — v0.2.6*
