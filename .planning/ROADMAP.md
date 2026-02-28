# Meitheal — Roadmap

## Phase Overview

| Phase | Name | Status | Iterations |
|-------|------|--------|------------|
| 1 | Foundation & Vertical Slice | ✅ Complete | 4 persona loop iterations |
| 2 | Integration Deepening | ✅ Complete | 1 persona loop iteration |
| 3 | PWA & Offline-First | ✅ Complete | 1 persona loop iteration |
| 4 | Cloud Runtime | ✅ Complete | 1 persona loop + 50-persona audit |
| 5 | Market Parity | 📋 Not started | — |

## Analysis Baseline

- Canonical competitor/gap package: `docs/analysis/`
- Cross-tool matrix: `docs/analysis/gap-matrix.md`
- Parity contract: `docs/analysis/parity-spec.md`
- Per-competitor details: `docs/analysis/competitors/*.md`

## Phase 1: Foundation & Vertical Slice ✅

**Goal:** Architecture docs, monorepo scaffold, CI/governance, one end-to-end vertical slice.

**Delivered:**
- DDD monorepo with 5 domain packages
- HA add-on: Dockerfile, ingress auth, Alloy config, Grafana dashboard
- Vertical slice: task create → framework fields → calendar sync → confirmation → audit trail
- Vikunja-compatible API: 7 routes with voice assistant interop
- 33 tests passing, 6-job CI pipeline
- Structured observability: compat logging, redaction, perf budgets, schema drift

**Persona Loop:** 4 iterations, OA-401 through OA-412 all closed.

**Source:** `.planning/persona-loops/phase-1/iteration-01..04/`

## Phase 2: Integration Deepening 🔜

**Goal:** Webhook emission, Grocy adapter, n8n/Node-RED integration, security hardening.

**RFC:** `docs/decisions/0006-iteration-05-integrations-rfc.md`

**Key deliverables:**
- HMAC-signed webhook emission for all domain events
- Grocy stock check adapter (ingredient checks on task create)
- Grafana dashboards for webhook/integration metrics
- SSRF hardening for `/api/unfurl`
- Rate limiting on compat API
- KCS runbook for webhook setup

## Phase 3: PWA & Offline-First 📋

**Goal:** Local-first PWA with service worker, IndexedDB queue, background sync, deterministic conflict resolution.

**Dependencies:** Phase 2 webhook infrastructure (sync conflict events)

## Phase 4: Cloud Runtime 📋

**Goal:** Cloudflare Workers adapter + D1, dual-runtime deployment.

**Existing scaffold:** `apps/api/` skeleton

## Phase 5: Market Parity 📋

**Goal:** Match Super Productivity + Vikunja core workflows. Passkeys/WebAuthn, rich links, Obsidian sync.

**Parity-driven deliverables:**
- Rich custom fields + forms logic with conditional UI.
- Portfolio/workload/priority workflow (RICE/DRICE/HEART overlays).
- Mobile/offline/collaboration parity improvements from PWA foundation.
- Integration ecosystem depth (Grocy, n8n, Node-RED, calendars, knowledge links).
- Parity verification against `docs/analysis/parity-spec.md`.

---
*Last updated: 2026-02-28 after brownfield initialization*
