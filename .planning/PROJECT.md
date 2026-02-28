# Meitheal — Project Definition

## What This Is

**Meitheal** — the cooperative task and life engine for your home. A clean-room OSS Life OS built on Astro SSR, running natively as a Home Assistant OS add-on and optionally on Cloudflare. It solves enterprise gaps (custom fields, RICE/HEART scoring, workload planning) while rejecting corporate sterility.

**Core Value:** Give households, homelabs, and communities a local-first task/portfolio platform that shares the cognitive load through cooperative automation.

**Organization:** Coolock-Village (Dublin, Ireland)
**Repository:** `Coolock-Village/meitheal`
**Branch:** `feat/iteration-2-ha-vertical-slice`
**License:** AGPL-3.0 (core), with clean-room protocol

## Requirements

### Validated
- Astro SSR with Node adapter for HA Green (2GB RAM)
- DDD monorepo: 5 bounded contexts (Auth, Tasks, Strategy, Observability, Integrations)
- SQLite via Drizzle ORM (HA) / D1 (Cloudflare future)
- HA add-on with ingress auth and Alloy observability pipeline
- Vikunja-compatible API surface for voice assistant interop
- Calendar sync via HA calendar service
- Structured JSON logging with secret redaction
- CI pipeline: 6 required jobs (governance, typecheck, ha-harness, migration, schema-drift, perf)

### Active
- Webhook emission for domain events (iteration-05 RFC drafted)
- Grocy adapter for inventory checks
- n8n/Node-RED integration via webhooks

### Out of Scope (current)
- Full Cloudflare Workers deployment
- Obsidian sync
- Calendar write-back from external events
- Full Grocy recipe management

## Key Decisions

| # | Decision | Outcome |
|---|----------|---------|
| ADR-001 | Legal and naming strategy | Dual-track: clean-room core + AGPL adapter |
| ADR-002 | Target architecture | HA-first Node/SQLite, Cloud-path Workers/D1 |
| ADR-003 | Clean-room protocol | Documented who can read upstream code |
| ADR-004 | Threat model | Auth, sync, integrations, unfurl risks |
| ADR-005 | HA calendar sync | Idempotency keys + confirmation flow |
| ADR-006 | Iteration-05 integrations RFC | Webhooks, Grocy, n8n/Node-RED |

## Constraints

- Must run on HA Green (2GB RAM, 128MB Node heap)
- Astro-first: no bespoke custom framework code
- Env-only secrets: no tokens in YAML/config
- DDD boundaries enforced: domain packages are infra-agnostic
- KCS culture: every behavior change updates docs in same commit
