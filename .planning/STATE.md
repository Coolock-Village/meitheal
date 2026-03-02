# Meitheal — Project State

## Project Reference

**Meitheal** — the cooperative task and life engine for your home.
Local-first task orchestration with HA calendar sync and Vikunja compatibility.

## Current Position

- **Planning model:** dual-track (`Primary Delivery` + `Extension Track`)
- **Primary Delivery:** 6 of 6 phases complete (`01-06 complete`)
- **Extension Track:** 15 of 15 phases complete (`15-24, 27-30 complete`)
- **Overall phase count:** 21 of 21 complete
- **Phase 43:** Security Hardening — complete (v0.1.17-v0.1.24)
- **Current version:** `0.1.24`

## Phase Status Snapshot

### Primary Delivery (`01-06`)

1. `01-foundation-vertical-slice` — `complete`
2. `02-integration-deepening` — `complete`
3. `03-pwa-offline-first` — `complete`
4. `04-cloud-runtime` — `complete`
5. `05-market-parity` — `complete`
6. `06-functional-ui` — `complete` (browser-verified, 4 summaries)

### Extension Track (`15-24`)

1. `15-ux-parity-boards` — `complete`
2. `16-astro-optimizations-ux` — `complete`
3. `17-full-persona-audit` — `complete`
4. `18-vikunja-card-parity` — `complete`
5. `19-kanban-overhaul` — `complete`
6. `20-deep-production-polish` — `complete`
7. `21-data-export-portability` — `complete`
8. `22-ai-context-generation` — `complete`
9. `23-offline-image-uploads` — `complete`
10. `24-perf-budgets-ci` — `complete`

### Global Track (`27-43`)

1. `27-security-accessibility` — `complete`
2. `28-structured-logging` — `complete`
3. `29-astro-optimization-audit` — `complete`
4. `30-web-api-integration` — `complete` (23 browser APIs, 14 modules)
5. `39-ha-addon-publishing` — `complete` (Docker Hub config, CI dual-push)
6. `43-security-hardening` — `complete` (structured logging, DB fallback, SSRF, security.txt)

## Recent Decisions

| Date | Decision | Context |
|------|----------|---------|
| 2026-03-02 | Dynamic health version | `health.ts` now reads version from `config.yaml` instead of hardcoding |
| 2026-03-02 | Allow .local/.home.arpa in SSRF | HA network domains are legitimate unfurl targets |
| 2026-03-02 | RFC 9116 security.txt | Added `/.well-known/security.txt` endpoint |
| 2026-03-02 | Calendar bridge merge | HA calendar events now sync into SQLite task store bidirectionally |
| 2026-03-01 | Regional Settings & Sidebar Config | Plumbed `timezone`, `weekStart`, `date_format` via Astro.locals |

## Pending Todo Queue

1. ~~Reconcile CodeQL check-suite status on PR #1.~~ — Resolved.
2. Run live HA workflow with real calendar entity and `HA_TOKEN`. *(Requires deployed environment)*
3. Run live Vikunja voice-assistant compatibility workflow. *(Requires deployed environment)*
4. ~~Evaluate Phase 06 draft plans.~~ — Superseded by extension track.
5. ~~Autonomous optimization sweeps.~~ — Complete: 0 TODO/FIXME/HACK, 0 errors, 0 warnings.
6. Set `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` as GitHub repo secrets for CI publishing.
7. Push initial images to Docker Hub and test install on HA Green.

> Items 2, 3, 6, and 7 require a live HA deployment to verify.

## Codebase Health (as of v0.1.24)

| Metric | Value |
|--------|-------|
| Tests | 129 passed, 0 failed, 45 skipped |
| TODO/FIXME/HACK | 0 |
| TS warnings | 0 |
| API endpoints | 38 |
| HA domain exports | 19 |

## Session Continuity

Last session: 2026-03-02T13:12:00Z
Stopped at: Phase 43 complete. Autonomous sweep shipped v0.1.17-v0.1.24.

Resume hint: Set Docker Hub secrets in GitHub, push images, install on HA Green for live testing.

---
*Last updated: 2026-03-02 during Phase 43 autonomous sweep*
