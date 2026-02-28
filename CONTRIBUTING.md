# Contributing to Meitheal

Thank you for your interest in contributing! Meitheal is a cooperative task and life engine for Home Assistant.

## Getting Started

```bash
# Clone
git clone https://github.com/Coolock-Village/meitheal.git
cd meitheal

# Install
npx pnpm install

# Dev server (Astro)
npx pnpm -C apps/web dev

# Typecheck all packages
npx pnpm check

# Run tests
npx pnpm test
```

## Project Structure

```
apps/
├── web/          # Astro SSR — HA add-on UI
│   └── src/
│       ├── domains/         # Bounded contexts
│       │   ├── integrations/ # Vikunja compat, HA calendar
│       │   └── offline/      # IndexedDB, sync engine, connectivity
│       ├── pages/           # Astro routes
│       └── components/      # UI components
├── api/          # Cloudflare Workers — dual runtime
packages/
├── integration-core/  # Bus, adapters, webhook, rate limiter, D1
├── domain-tasks/      # Task domain logic
├── domain-strategy/   # Framework scoring (RICE/DRICE)
├── domain-auth/       # Authentication
└── domain-observability/ # Logging, metrics, audit trail
```

## Architecture Principles

- **DDD:** Each bounded context has explicit domain boundaries
- **Ubiquitous language:** "task", "transcription", "framework", "integration"
- **Astro-first:** SSR via Astro, not SPA
- **HA-native:** Supervisor token, ingress auth, add-on lifecycle
- **Dual-runtime:** Same domain packages for HA (Node) and Cloudflare

## Making Changes

1. **Branch** from `main` — use `feat/`, `fix/`, `docs/` prefixes
2. **Write tests** for new functionality
3. **Run typecheck** — `npx pnpm check` must pass with 0 errors
4. **Run tests** — `npx pnpm test` must pass
5. **Commit** with descriptive messages (emoji prefixes welcome)
6. **PR** against `main` — include what changed and why

## Code Style

- TypeScript strict mode (exactOptionalPropertyTypes, noUncheckedIndexedAccess)
- No `any` — use `unknown` and narrow
- Explicit error handling — no silent failures
- Document as you go (KCS principle)

### No Dummy Data or Fake Functionality

> **This is a hard requirement.** All code must be real, functional, and production-grade.

- ❌ No placeholder/dummy data (e.g. `"Lorem ipsum"`, `"Test User"`, hardcoded fake lists)
- ❌ No fake API responses or mocked production behavior
- ❌ No `TODO: implement later` stubs that pretend to work
- ❌ No hardcoded sample data masquerading as real content
- ✅ Use real integrations, real database queries, real API calls
- ✅ Tests may use mocks — production code must not
- ✅ If a feature isn't ready, gate it behind a feature flag — don't fake it

## ADRs

Architecture decisions are documented in `docs/decisions/`. When making structural changes, create a new ADR following the existing pattern.

## Tests

- **Unit/integration:** Playwright test runner in `tests/` workspace
- **Governance:** Repo standards in `tests/governance/`
- Run all: `npx pnpm test`

---

*Meitheal means "cooperative work" in Irish. Let's build together.*
