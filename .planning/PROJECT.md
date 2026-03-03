# Meitheal — Project Definition

## What This Is

**Meitheal** — the cooperative task and life engine for your home.

A clean-room OSS Life OS built on Astro SSR for households, homelabs, and communities. It runs natively as a Home Assistant app/add-on and optionally on Cloudflare.

## Planning State Alignment

- Planning contract: `.planning/README.md`
- Roadmap model: dual-track (`Primary Delivery 01-06`, `Extension Track 15-24`)
- Current completion: primary `6/6`, extension `10/10`

## Requirements

### Validated (implemented)

- Astro SSR runtime with HA-first topology (`apps/web/`, `meitheal-hub/`)
- DDD domain packages (`domain-auth`, `domain-tasks`, `domain-strategy`, `domain-observability`, `integration-core`)
- In-app domains (`auth/`, `ha/`, `todo/`, `tasks/`, `integrations/vikunja-compat/`)
- SQLite/libSQL persistence with Drizzle schema and 3 migrations
- HA calendar + todo sync (bidirectional) with confirmation flow
- Vikunja compatibility API surface used by voice-assistant clients
- Ingress-safe server wrapper (`serve.mjs`) preventing 301 redirect loops
- Structured JSON logging and redaction policy
- Governance and required docs checks
- Settings UX with auto-detect HA connection and integration cards

### Active (next execution targets)

- Validate v0.2.6 addon on HA Green with real calendar entity
- Run live HA and Vikunja compat workflows on deployed environment
- Continue UX audit (Dashboard/Home page next)
- PWA service worker scope validation under ingress

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
| ADR-008+ | 5 additional ADRs (see `docs/decisions/`) | Various |

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
*Last updated: 2026-03-03 — v0.2.6 ingress fix + Settings UX*
