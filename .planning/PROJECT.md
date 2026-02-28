# Meitheal — Project Definition

## What This Is

**Meitheal** — the cooperative task and life engine for your home.

A clean-room OSS Life OS built on Astro SSR for households, homelabs, and communities. It runs natively as a Home Assistant app/add-on and optionally on Cloudflare. Forged in Coolock, Dublin.

**Core Value:** Local-first task orchestration that shares the cognitive load through cooperative automation — your home, your data, your village.

## Requirements

### Validated

- ✓ Astro 5.18 SSR with `@astrojs/node` adapter — existing (`apps/web/`)
- ✓ DDD monorepo: 5 bounded contexts (Auth, Tasks, Strategy, Observability, Integrations) — existing (`packages/domain-*/`)
- ✓ SQLite via Drizzle ORM 0.45 + libSQL — existing (`apps/web/drizzle/`)
- ✓ HA OS add-on: Dockerfile, config.yaml, ingress auth, Alloy observability — existing (`addons/meitheal-hub/`)
- ✓ Vikunja-compatible API: 7 routes for voice assistant interop — existing (`apps/web/src/pages/api/v1/`)
- ✓ Calendar sync: HA calendar service adapter with idempotency — existing (`packages/integration-core/`)
- ✓ Structured JSON logging with secret redaction — existing (`packages/domain-observability/`)
- ✓ Compat API observability: structured request logging + Grafana dashboard — existing
- ✓ CI pipeline: 6 required jobs — existing (`.github/workflows/ci.yml`)
- ✓ Governance tests: repo standards, perf budgets, schema drift — existing (`tests/governance/`)
- ✓ HA custom component skeleton — existing (`integrations/home-assistant/`)
- ✓ Clean-room protocol + legal/naming ADR — existing (`docs/decisions/0001`, `0003`)

### Active

- [ ] Webhook emission for domain events (HMAC-signed)
- [ ] Grocy stock check adapter
- [ ] n8n / Node-RED integration via webhooks
- [ ] Operational dashboards for integrations
- [ ] Local-first PWA: service worker, IndexedDB, background sync
- [ ] Passkeys / WebAuthn with Conditional UI
- [ ] Cloudflare Workers + D1 runtime path
- [ ] Rich link unfurl with SSRF hardening
- [ ] Market parity with Super Productivity + Vikunja core workflows

### Out of Scope

- Full Grocy recipe management — beyond current integration scope
- Obsidian sync — deferred to Phase 5+
- Calendar write-back from external events — deferred
- Electron/Tauri desktop wrapper — violates Astro-first principle

## Key Decisions

| # | Decision | Rationale | Outcome |
|---|----------|-----------|---------|
| ADR-001 | Dual-track licensing | Clean-room core vs. AGPL adapter | Established |
| ADR-002 | HA-first architecture | Node/SQLite primary, Workers/D1 secondary | Established |
| ADR-003 | Clean-room protocol | Who reads upstream, what can be referenced | Established |
| ADR-004 | Threat model | Auth, sync, integrations, unfurl risks | Established |
| ADR-005 | Calendar sync design | Idempotency keys + confirmation flow | Established |
| ADR-006 | Iteration-05 RFC | Webhooks, Grocy, n8n/Node-RED adapters | Draft |

## Constraints

- Must run on HA Green (2GB RAM, 128MB Node heap)
- Astro-first: favor OSS Astro integrations over bespoke code
- Env-only secrets: no tokens in YAML/config/client bundles
- DDD boundaries: domain packages are infrastructure-agnostic
- KCS culture: every behavior change updates docs in same commit
- AGPL-3.0 obligations for any Vikunja-derived code

## Source Artifacts

Synthesized from:
- `.planning/codebase/STACK.md`, `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `INTEGRATIONS.md`, `CONCERNS.md`
- `.planning/persona-loops/phase-1/iteration-01..04/`
- `README.md`, `docs/decisions/0001..0006`, `docs/kcs/*`

---
*Last updated: 2026-02-28 after brownfield initialization*
