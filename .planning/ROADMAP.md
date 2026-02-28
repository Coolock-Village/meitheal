# Meitheal — Roadmap

## Phases

### Phase 1: Foundation & Vertical Slice ✅
**Goal:** Architecture docs, monorepo scaffold, CI/governance, one end-to-end vertical slice.
**Status:** Complete (iterations 01–04)

Delivered:
- DDD monorepo with 5 domain packages
- HA add-on with Dockerfile, ingress auth, Alloy config
- Task create → framework fields → calendar sync → confirmation → audit trail
- Vikunja-compatible API (7 routes) with voice assistant interop
- 6-job CI pipeline with governance, perf budgets, schema drift
- 33 tests passing, structured observability logging

### Phase 2: Integration Deepening 🔜
**Goal:** Webhook emission, Grocy adapter, n8n/Node-RED integration, operational dashboards.
**Status:** Ready to plan

Key deliverables:
- HMAC-signed webhook emission for all domain events
- Grocy stock check adapter
- Grafana dashboards for webhook/integration metrics
- KCS runbook for webhook setup

RFC: `docs/decisions/0006-iteration-05-integrations-rfc.md`

### Phase 3: PWA & Offline 📋
**Goal:** Local-first PWA with service worker, IndexedDB queue, background sync, conflict resolution.
**Status:** Not started

### Phase 4: Cloud Runtime 📋
**Goal:** Cloudflare Workers adapter + D1, dual-runtime deployment.
**Status:** Not started (skeleton exists at `apps/api/`)

### Phase 5: Market Parity 📋
**Goal:** Match Super Productivity + Vikunja core workflows. Passkeys/WebAuthn, rich links, Obsidian sync.
**Status:** Not started
