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
- **Phase 70:** Integration Auto-Discovery — complete (all 3 high-sev already implemented)
- **Current version:** `0.1.59`

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
9. `58-css-domain-split` — `complete` (2316-line monolith → 14 domain-scoped partials, 2-iteration GSD persona loop: 15 personas, 7 actions resolved, 3 deferred)

## Recent Decisions

| Date | Decision | Context |
|------|----------|---------|
| 2026-03-04 | **v0.1.59** — CSS domain split: 14 partials, lean `global.css` hub | `global.css` was 2316 lines; split into `_tokens`, `_base`, `_layout`, `_forms`, etc. |
| 2026-03-04 | n8n auto-mode save no longer requires webhook URL | HA addon mode uses WebSocket, not HTTP; save handler now persists `n8n_mode: ha_addon` |
| 2026-03-04 | Calendar settings persistence — `calendar_sync_enabled` + `calendar_write_back` | Save handler now persists both flags + calls `/api/integrations/calendar/sync` |
| 2026-03-04 | 6 missing `ALLOWED_KEYS` added to import/export | `n8n_mode`, `n8n_api_key`, `n8n_signing_secret`, `todo_sync_enabled`, `todo_entity`, `todo_sync_direction` |
| 2026-03-04 | CSRF structured logging (no debug payload in response) | Helps diagnose 403s without leaking internals |
| 2026-03-04 | UI/UX polish wave — stat card icons, bento grid sizing, task type icons `✅`→`📌` | Page-by-page browser audit across all 7 views |
| 2026-03-04 | Fix HA version requirement — `conversation` dep made optional, LLM API conditional | HA 2026.2.3 blocked integration load; `manifest.json` `after_dependencies` |
| 2026-03-04 | New HA services: `search_tasks`, `get_overdue_tasks` with `SupportsResponse.ONLY` | Enables voice/LLM queries for task data |
| 2026-03-04 | `hassio` added as hard dependency in `manifest.json` | Required for Supervisor discovery API |
| 2026-03-04 | `/api/ha/addons` graceful 403 handling | Returns empty list with message instead of error on insufficient perms |
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

1. ~~Run live HA workflow with real calendar entity and deployed addon.~~ *(v0.1.57 deployed, calendar sync persistence added)*
2. Run live Vikunja voice-assistant compatibility workflow.
3. ~~Push initial images to Docker Hub and test install on HA Green.~~ *(CI builds via v0.1.57 tag)*
4. Validate sidebar drag-and-drop reordering end-to-end.
5. ~~PWA service worker scope validation under ingress.~~ *(Phase 59: SW registered, manifest valid, install prompt wired)*
6. Test calendar + todo entity selection in HA ingress after v0.1.57 restart.

## Codebase Health (as of v0.1.57)

| Metric | Value |
|--------|-------|
| E2E test specs | 38 |
| ADRs | 12 |
| KCS docs | 11 |
| API endpoint files | 43 |
| DB migrations | 3 |
| Build time | ~4.6s |

## Session Continuity

Last session: 2026-03-04T19:10:00Z
Stopped at: v0.1.59 — Phase 58 complete (2 iterations). CSS domain split with full GSD persona optimization loop. Iteration 2 fixed: dup `@keyframes skeleton-pulse`, contaminated classes in `_feedback.css`/`_modal.css`/`_table.css`, added CSP comments, domain headers, class-map.

Resume hint: Continue page-by-page UX audit (Kanban, Calendar views). Verify v0.1.59 on HA after addon restart. Deferred items: CI brace glob, CSS duplicate lint, `!important` audit.

---
*Last updated: 2026-03-04 — Phase 58 GSD persona loop complete (2 iterations)*
