# Meitheal — Project State

## Project Reference

**Meitheal** — the cooperative task and life engine for your home.
Local-first task orchestration with HA calendar sync and Vikunja compatibility.

## Current Position

- **Planning model:** dual-track (`Primary Delivery` + `Extension Track`)
- **Primary Delivery:** 6 of 6 phases complete (`01-06 complete`)
- **Extension Track:** 15 of 15 phases complete (`15-24, 27-30 complete`)
- **Overall phase count:** 21+ phases complete (including global track + security + UX)
- **Phase 56:** Settings IA Overhaul — complete
- **Current version:** `0.1.50`

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

### Global Track (`27-54`)

1. `27-security-accessibility` — `complete`
2. `28-structured-logging` — `complete`
3. `29-astro-optimization-audit` — `complete`
4. `30-web-api-integration` — `complete` (23 browser APIs, 14 modules)
5. `39-ha-addon-publishing` — `complete` (GHCR + Docker Hub, CI dual-push)
6. `43-security-hardening` — `complete` (structured logging, DB fallback, SSRF, security.txt)
7. `54-settings-integrations-ux` — `complete` (auto-detect connection, integration cards, tooltips)
8. `56-settings-ia-overhaul` — `complete` (sidebar-first, HA→Integrations, PWA demote, Help section)

## Recent Decisions

| Date | Decision | Context |
|------|----------|---------|
| 2026-03-03 | Settings IA overhaul — sidebar first, HA→Integrations, PWA compact, Help section | Persona audit: 10 findings, 4 med severity |
| 2026-03-03 | Fix HA connection status — call `getHAConnection()` before `getHAConnectionStatus()` | Endpoint only read cached singleton; never established WebSocket |
| 2026-03-03 | **Do NOT use `apiUrl()` for `fetch()` calls** — global monkey-patch handles it | `Layout.astro` inline script auto-prefixes `window.__ingress_path`; `apiUrl()` would double-prefix |
| 2026-03-03 | Ingress-safe `serve.mjs` wrapper | Prevents 301 redirect loop from double trailing slashes |
| 2026-03-03 | Addon rename `meitheal_hub` → `meitheal` | Slug shortened in `config.yaml`, `ingress-policy.ts` |
| 2026-03-03 | Settings auto-detect HA connection | Replaced manual URL/token form with status card |
| 2026-03-03 | ViewTransitions disabled behind ingress | Prevents redirect loops via ingress iframe |
| 2026-03-02 | Dynamic health version | `health.ts` reads version from `config.yaml` |
| 2026-03-02 | Calendar bridge merge | HA calendar events sync bidirectionally |
| 2026-03-01 | Regional Settings & Sidebar Config | Plumbed `timezone`, `weekStart`, `date_format` via Astro.locals |

## Pending Todo Queue

1. Run live HA workflow with real calendar entity and deployed addon. *(Requires v0.2.6 running)*
2. Run live Vikunja voice-assistant compatibility workflow.
3. Push initial images to Docker Hub and test install on HA Green.
4. Validate sidebar drag-and-drop reordering end-to-end.
5. PWA service worker scope validation under ingress.

## Codebase Health (as of v0.2.6)

| Metric | Value |
|--------|-------|
| E2E test specs | 38 |
| ADRs | 12 |
| KCS docs | 11 |
| API endpoint files | 42 |
| DB migrations | 3 |
| Build time | ~3.9s |

## Session Continuity

Last session: 2026-03-03T18:30:00Z
Stopped at: Settings IA overhaul complete (Phase 56). HA Connection moved to Integrations, PWA demoted to compact, Help section added.

Resume hint: Tag v0.1.50 and deploy to HA addon. Consider setting up HA devcontainer for local addon testing.

---
*Last updated: 2026-03-03 — Settings IA overhaul (Phase 56)*
