# Testing Patterns

**Analysis Date:** 2026-02-28

## Test Framework

**Runner:**
- Playwright 1.58
- Config: `tests/playwright.config.ts`

**Assertion Library:**
- Playwright's built-in `expect`

**Run Commands:**
```bash
pnpm --filter @meitheal/tests test          # All tests
pnpm --filter @meitheal/tests test <file>   # Specific spec
pnpm check                                  # Typecheck all packages
```

## Test File Organization

**Location:**
- Separate `tests/` workspace package (not co-located)
- E2E tests: `tests/e2e/`
- Governance tests: `tests/governance/`
- Scripts: `tests/scripts/`

**Naming:**
- `<feature>.spec.ts` or `<feature>.spec.mjs`

**Structure:**
```
tests/
├── e2e/
│   ├── _helpers.ts
│   ├── ha-calendar-adapter.spec.ts
│   ├── task-sync-persistence.spec.ts
│   ├── vikunja-compat.spec.ts
│   ├── vikunja-compat-auth.spec.ts
│   ├── vikunja-compat-calendar-sync.spec.ts
│   ├── ingress-header-validation.spec.ts
│   ├── migration-splitter.spec.mjs
│   ├── logger-redaction.spec.ts
│   └── ... (21 total)
├── governance/
│   └── repo-standards.spec.ts
├── scripts/
│   └── verify_vikunja_voice_assistant_compat.py
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

## Test Structure

**Suite Organization:**
```typescript
import { test, expect } from "@playwright/test";

test.describe("feature area", () => {
  test("specific behavior", async () => {
    // Arrange → Act → Assert
  });
});
```

**Patterns:**
- Tests import domain logic directly from workspace packages
- HA tests use HTTP harness to simulate HA calendar service
- Persistence tests use in-memory SQLite (`file::memory:`)
- Tests are self-contained — no shared state between specs

## Mocking

**Framework:** No explicit mocking framework

**Patterns:**
- HA calendar adapter tests mock the HA HTTP API via local HTTP server
- Vikunja compat tests validate API surface directly
- No dependency injection — tests exercise actual code paths

## Coverage

**Requirements:** None enforced

## Test Types

**Unit Tests (as E2E specs):**
- `task-sync-domain.spec.ts` — Domain logic tests
- `logger-redaction.spec.ts` — Redaction pattern tests
- `migration-splitter.spec.mjs` — SQL splitter edge cases

**Integration Tests:**
- `ha-calendar-adapter.spec.ts` — HA calendar service integration
- `task-sync-persistence.spec.ts` — SQLite persistence layer
- `vikunja-compat.spec.ts` — Vikunja API compatibility
- `vikunja-compat-auth.spec.ts` — Token auth validation
- `vikunja-compat-calendar-sync.spec.ts` — Calendar sync mode
- `ingress-header-validation.spec.ts` — Ingress spoofing permutations

**Governance Tests:**
- `repo-standards.spec.ts` — Required files, semantic fields, maintainer format

**Browser E2E (placeholder):**
- `pages.spec.ts`, `navigation.spec.ts`, `seo.spec.ts`, `accessibility.spec.ts` — Require `E2E_BASE_URL`

**CI Jobs Using Tests:**
- `typecheck-and-tests` — runs all tests
- `ha-harness` — runs `ha-calendar-adapter.spec.ts` specifically
- `migration-check` — runs `db:migrate` + `db:migrate:check`
- `schema-drift` — runs `schema:drift`
- `perf-budgets` — runs `perf:budget` (custom check, not Playwright)

---

*Testing analysis: 2026-02-28*
