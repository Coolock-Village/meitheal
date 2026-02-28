# Meitheal — Project Definition

## What This Is

**Meitheal** — the cooperative task and life engine for your home.

A clean-room OSS Life OS built on Astro SSR for households, homelabs, and communities. It runs natively as a Home Assistant app/add-on and optionally on Cloudflare.

## Planning State Alignment

- Planning contract: `.planning/README.md`
- Roadmap model: dual-track (`Primary Delivery 01-06`, `Extension Track 15-18`)
- Current completion: primary `5/6`, extension `0/4`

## Requirements

### Validated (implemented)

- Astro SSR runtime with HA-first topology (`apps/web/`, `addons/meitheal-hub/`)
- DDD domain packages (`domain-auth`, `domain-tasks`, `domain-strategy`, `domain-observability`, `integration-core`)
- SQLite/libSQL persistence with Drizzle schema and migrations
- HA calendar sync and confirmation flow with idempotency
- Vikunja compatibility API surface used by voice-assistant clients
- Structured JSON logging and redaction policy
- Governance and required docs checks
- Competitor gap matrix + parity contract baseline in `docs/analysis/`

### Active (next execution targets)

- Clear PR #1 blockers (`perf-budgets`, CodeQL check-suite reconciliation)
- Decide and execute phase `06` draft plans or replace with fresh execution plans
- Promote extension-track phases (`15-18`) only when execution artifacts are ready
- Continue HA publishing compliance checks (repository/add-on contracts)

### Out of Scope (current cycle)

- Rewriting runtime architecture outside Astro-first model
- Removing existing planning artifacts for cleanup convenience
- Treating extension-track context-only phases as completed work

## Key Decisions

| # | Decision | Outcome |
|---|----------|---------|
| ADR-001 | Dual-track licensing posture | Established |
| ADR-002 | HA-first architecture | Established |
| ADR-003 | Clean-room protocol | Established |
| ADR-004 | Threat model baseline | Established |
| ADR-005 | Calendar sync + idempotency | Established |
| ADR-006 | Integration RFC (iteration-05) | Draft |
| ADR-007 | Competitor matrix/parity contract | Established |

## Constraints

- Astro-first/native delivery; prefer official/open Astro integrations where suitable.
- HA add-on compatibility and HA publishing alignment are mandatory.
- DDD context boundaries enforced; no deep cross-context imports.
- KCS updates are required alongside behavior changes.
- Env-only secrets; no token leakage in YAML/client surfaces.
- Structured logging schema must remain Loki-friendly (low-cardinality labels only).

## Source Artifacts

- `.planning/codebase/*.md`
- `.planning/phases/*`
- `.planning/persona-loops/*`
- `docs/analysis/gap-matrix.md`
- `docs/analysis/parity-spec.md`
- `docs/analysis/competitors/*.md`
- `docs/decisions/*.md`
- `docs/kcs/*.md`

---
*Last updated: 2026-02-28 during GSD recovery normalization pass*
