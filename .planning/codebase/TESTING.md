# Testing

> Last mapped: 2026-03-09 — v0.1.99

## Framework

| Aspect | Detail |
|--------|--------|
| Runner | Playwright Test |
| Package | `@meitheal/tests` |
| Config | `tests/playwright.config.ts` |
| Total specs | 48 files |
| Total tests | 340 (275 passing, 65 skipped as of v0.1.99) |
| Run command | `pnpm --filter @meitheal/tests test` |

## Test Structure

```
tests/
├── e2e/                        # 30 end-to-end test files
│   ├── api.spec.ts             # Core API endpoint tests
│   ├── pages.spec.ts           # Page rendering tests
│   ├── navigation.spec.ts      # Route navigation tests
│   ├── seo.spec.ts             # SEO meta tag validation
│   ├── accessibility.spec.ts   # A11y checks
│   ├── security-headers.spec.ts # CSP, HSTS, CSRF headers
│   ├── ha-calendar-adapter.spec.ts # HA calendar integration
│   ├── vikunja-compat.spec.ts  # Vikunja v1 API compatibility
│   ├── offline-sync.spec.ts    # Offline sync engine
│   ├── pwa-offline.spec.ts     # PWA/SW behavior
│   ├── webhook-signer.spec.ts  # HMAC webhook signing
│   ├── rate-limiter.spec.ts    # Rate limiting
│   ├── ticket-number.spec.ts   # Ticket key generation
│   ├── task-type-api.spec.ts   # Task type CRUD
│   ├── user-assignment.spec.ts # User assignment (24 tests)
│   ├── ingress-state-persistence.spec.ts # Ingress state
│   ├── ingress-header-validation.spec.ts # Ingress headers
│   ├── logger-redaction.spec.ts # Log redaction
│   └── ... (11 more)
├── governance/
│   └── iqs-platinum.spec.ts    # IQS Platinum quality checks
├── unit/                       # 18 unit test files
│   └── todo-status-mapper.spec.ts # Status mapping
├── scripts/                    # Test helper scripts
└── types/                      # Test type definitions
```

## Testing Patterns

### HTTP Server Harness
- Tests spin up a **local HTTP server** simulating HA Supervisor API
- No external mocking framework — uses Node.js `http.createServer()`
- Temp SQLite databases via `file:${tmpdir}/...`

### No Shared State
- Each test creates its own database
- No global fixtures or shared mutable state
- Tests are fully parallelizable

### Domain Logic Imports
- Tests import workspace packages directly:
  ```typescript
  import { calculateRICE } from "@meitheal/domain-strategy"
  import { createLogger } from "@meitheal/domain-observability"
  ```

### API Testing
- Tests call API routes via fetch against the local server
- Validates response status, headers, and JSON body
- Checks error responses and edge cases

## CI Pipeline

```yaml
# .github/workflows/ci.yml
jobs:
  governance:        # Required files exist, CSS brace balance
  typecheck-and-tests: # pnpm install → pnpm check → pnpm test
  ha-harness:        # HA-specific integration tests
  docker:            # Build multi-arch Docker image (tag-triggered)
```

## Verification Tiers

| Tier | What | How |
|------|------|-----|
| 🔧 Tier 1 | CSS, layout, UI, client JS | `npm run dev` in `apps/web/` |
| 🏠 Tier 2 | Ingress, middleware, HA API | `./scripts/devcontainer-up.sh` |
| 🌐 Tier 3 | Final acceptance on real data | `ha.internal:8123` |

## Current Coverage Gaps

- No dedicated unit tests for `lib/` utilities (task-api-client, toast, etc.)
- Gamification (XP, streaks) has no test specs
- Calendar CalDAV client has limited coverage
- Frontend interactions (kanban drag-drop, table sort) untested
