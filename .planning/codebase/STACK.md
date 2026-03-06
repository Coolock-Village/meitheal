# Technology Stack

**Analysis Date:** 2026-03-06
**Version:** 0.3.0

## Languages

| Language | Role | Files |
|----------|------|-------|
| TypeScript 5.8 | Application + test code | `.ts`, `.astro` |
| JavaScript (ESM) | Build/migration scripts | `.mjs` |
| Bash | Add-on runtime, CI | `run.sh`, CI scripts |
| Python | HA custom component, test verifier | `__init__.py`, `verify_*.py` |
| SQL | Drizzle migrations | `drizzle/migrations/` |
| YAML | HA config, CI workflows, content schemas | `.yaml`, `.yml` |

## Runtime

- **Node.js 22** — CI and production
- **pnpm 10.8.0** — workspace-based monorepo
- **Lockfile:** `pnpm-lock.yaml`
- **Workspace config:** `pnpm-workspace.yaml`

## Frameworks

| Framework | Version | Purpose |
|-----------|---------|---------|
| Astro | 5.18 | SSR web framework (server output) |
| `@astrojs/node` | 9.5 | Node standalone adapter for HA |
| `@astrojs/mdx` | 4.3 | MDX content support |
| `@astrojs/tailwind` | 6.0 | Styling |
| `astro:transitions` | built-in | ViewTransitions (prefetch + `swap` fallback) |
| `@astrojs/sitemap` | 3.7 | SEO |
| Drizzle ORM | 0.45 | Schema + queries |
| `@libsql/client` | 0.15 | SQLite driver (libSQL) |
| `drizzle-kit` | 0.31 | Migration tooling |
| Playwright | 1.58 | E2E + integration tests |
| `@axe-core/playwright` | 4.11 | Accessibility testing |
| Zod | 3.24 | Runtime validation |
| undici | 7.16 | HTTP client |

## Fonts (Self-Hosted)

| Package | Purpose |
|---------|---------|
| `@fontsource-variable/inter` | Primary UI font (variable weight) |
| `@fontsource/jetbrains-mono` | Monospace for task IDs, code blocks (400 + 500) |

Fonts are bundled in the build — no external CDN requests to Google Fonts.
Prevents ad-blocker interference and works fully offline.

## CSS Architecture

**Approach:** Domain-scoped CSS partials with `@import`.

`global.css` is a lean hub file (~37 lines) that declares `@tailwind` directives and imports 14 partials:

| Partial | Domain | Content |
|---------|--------|---------|
| `_tokens.css` | Design system | Fonts, `:root` vars, light/auto themes, HA passthr |
| `_base.css` | Global | Resets, typography, scrollbar, focus |
| `_layout.css` | Layout | Sidebar, main-content, topbar, stat-card, HA compact |
| `_forms.css` | Forms | Inputs, selects, labels, groups |
| `_buttons.css` | Buttons | btn variants, micro-interactions, loading spinner |
| `_cards.css` | Cards | Card, badges, status indicators |
| `_tasks.css` | Tasks (DDD) | Task items, bento grid, checklist, task detail, priorities |
| `_kanban.css` | Kanban (DDD) | Board, columns, cards, drag-drop, lane management |
| `_table.css` | Table | Data table, sticky column, editable cells, filters |
| `_feedback.css` | Feedback | Toast, skeleton, empty states, error boundary |
| `_search.css` | Search | Search input, results, items |
| `_modal.css` | Modal | Overlay, dialog, titles, actions |
| `_responsive.css` | Cross-cutting | Mobile, print, touch, high contrast |
| `_utilities.css` | Cross-cutting | a11y, transitions, animations, reduced motion |

**Convention:** `_` prefix = not standalone. Import order matters for cascade.
**Why not Astro `<style>`?** Shared classes (`.btn`, `.card`, `.form-input`) span multiple pages — scoped styles would require `:global()` everywhere.
**Quality:** Full GSD persona loop (15 personas, 2 iterations) — domain headers, CSP audit, class-map in `global.css`, zero duplicate `@keyframes`.
**Type Safety:** `types/window.d.ts` — 16 typed window properties for cross-component communication (eliminated 22+ `as any` casts).
**HA Ingress:** All ~82 client-side `fetch()` calls prefix `window.__ingress_path` for Supervisor ingress proxy safety.

## Configuration

**Environment Variables:**

| Variable | Required | Purpose |
|----------|----------|---------|
| `MEITHEAL_VERSION` | Auto | Addon version (set by run.sh, read by health endpoint) |
| `MEITHEAL_DB_URL` | Yes | SQLite path (default: `file:/data/meitheal.db`) |
| `SUPERVISOR_TOKEN` | Auto | HA supervisor auth |
| `ASTRO_NODE_AUTOSTART` | Auto | Set to `disabled` by `serve.mjs` to prevent Astro double-server |
| `MEITHEAL_VIKUNJA_API_TOKEN(S)` | Optional | Compat API auth |
| `MEITHEAL_LOG_LEVEL` | Optional | Log level |
| `MEITHEAL_LOG_REDACTION` | Optional | PII/secret redaction |
| `MEITHEAL_AUDIT_ENABLED` | Optional | Audit trail |
| `LOKI_URL` | Optional | Observability pipeline |
| `MEITHEAL_COMPAT_CALENDAR_SYNC_MODE` | Optional | Calendar sync for compat API |
| `MEITHEAL_PERF_BUDGET_*` | Optional | Performance threshold overrides |

**Build Config:**
- `astro.config.mjs` — Astro + integrations
- `drizzle.config.ts` — Database migrations
- `tsconfig.base.json` — Shared TypeScript config

## Platform Requirements

| Environment | Requirements |
|-------------|-------------|
| Development | Node.js 22+, pnpm 10.8+, SQLite-compatible FS |
| Production (HA) | HA OS, amd64/aarch64, Alpine 3.23 base, 128MB Node heap, `/data/` write access |
| Cloud (future) | Cloudflare Workers + D1 |

## Deployment (HA Addon)

> **⚠️ Pushing code to GitHub does NOT deploy to HA.** You must push a version tag to trigger the CI Docker image build, then restart the addon.

### Deploy Flow

| Step | Action | Details |
|------|--------|---------|
| 1. Bump version | Edit `meitheal-hub/config.yaml` → `version:` + `run.sh` | Must match tag (e.g. `0.2.6` → `v0.2.6`) |
| 2. Commit + tag | `git commit` then `git tag v0.2.6` | Tag triggers CI |
| 3. Push | `git push origin main --tags` | Pushes code + tag to GitHub |
| 4. CI builds | `publish-addon-images.yml` runs automatically | Builds amd64 + aarch64 Docker images |
| 5. Restart addon | HA → Settings → Add-ons → Meitheal → Restart | Pulls new image |

### CI Workflow: `publish-addon-images.yml`

- **Triggers**: `v*` tag push, or manual `workflow_dispatch`
- **Builds**: amd64 + aarch64 via `docker buildx`
- **Pushes to**: GHCR (`ghcr.io/coolock-village/meitheal-{arch}`) + Docker Hub (`coolockvillage/meitheal-{arch}`)
- **Validates**: release tag matches `config.yaml` version
- **Lockfile**: `--frozen-lockfile` enforced for deterministic builds

### Local Build (alternative): `./meitheal-hub/build-push-dev.sh`

- Requires `docker buildx` + `docker login -u coolockvillage`
- Host OS has `podman` only — use distrobox or CI instead

### Local Testing with HA Devcontainer

The recommended way to test addons during development:

1. Copy [devcontainer.json](https://github.com/home-assistant/devcontainer/raw/main/addons/devcontainer.json) to `.devcontainer/devcontainer.json`
2. Copy [tasks.json](https://github.com/home-assistant/devcontainer/raw/main/addons/tasks.json) to `.vscode/tasks.json`
3. Open folder in VS Code → "Reopen in Container"
4. Run task "Start Home Assistant" → access at `http://localhost:7123/`
5. Addon auto-detected in Local Apps repository

Reference: https://developers.home-assistant.io/docs/apps/testing/

**Alternative**: Run `npm run dev` in `apps/web/` for UI-only changes (no HA Supervisor context).

### Key Files

| File | Purpose |
|------|---------|
| `meitheal-hub/Dockerfile` | Multi-stage: node:22-alpine3.23 builder → HA base runtime |
| `meitheal-hub/config.yaml` | HA addon config (version, ingress, arch, watchdog, backup) |
| `meitheal-hub/build.json` | Extended build config (base images, OCI labels) |
| `meitheal-hub/run.sh` | Addon entrypoint (reads HA options, starts Node via `serve.mjs`) |
| `apps/web/scripts/serve.mjs` | Ingress-safe HTTP wrapper (normalizes `//` → `/`, prevents 301 loops) |
| `meitheal-hub/translations/en.yaml` | UI translations for config options |
| `meitheal-hub/build-push-dev.sh` | Local build + push script |
| `repository.yaml` | HA addon repository metadata |
| `.github/workflows/publish-addon-images.yml` | CI Docker build + push |

## PWA Infrastructure

**Phase 59** wired the previously-dead PWA lifecycle (service worker was exported but never called).

| Component | File | Purpose |
|-----------|------|---------|
| SW Registration | `src/domains/offline/sw-register.ts` | Registers SW, sends ingress path, detects updates |
| Service Worker | `public/sw.js` | 4 scoped caches with TTL eviction |
| Install Banner | `src/components/pwa/PwaInstallBanner.astro` | Dismissible bottom banner (7-day cooldown) |
| Settings PWA | `src/components/settings/SettingsSystem.astro` | Install/Update buttons, SW version display |
| Manifest | `src/pages/manifest.webmanifest.ts` | Dynamic ingress-aware manifest with screenshots |
| Offline Page | `src/pages/offline.astro` | Ingress-aware fallback with `role="alert"` |

**Cache Eviction Strategy:**

| Cache | Strategy | Max Entries | TTL |
|-------|----------|-------------|-----|
| `precache` | Version-bump | ~11 | ∞ |
| `static` | Cache-first | 100 | 7 days |
| `api` | Network-first | 50 | 1 hour |
| `nav` | Network-first | 20 | 24 hours |

Eviction runs on activate + throttled every 5 min during fetch. Update checks every 5 minutes (not 60s — appropriate for HA addon).

## Security & Hardening

| Area | Implementation |
|------|----------------|
| CSP | Strict policy — no external CDN allowed (`font-src 'self'`, `style-src 'self' 'unsafe-inline'`) |
| Error responses | All API catch blocks return generic `"Internal server error"` (CWE-209) |
| Viewport | WCAG 2.1 SC 1.4.4 compliant (no `user-scalable=0`) |
| Input validation | `sanitize-html` strips XSS vectors; taskId regex-validated before use |
| Settings API | Sensitive keys (`grocy_api_key`, `webhook_secret`) redacted in bulk GET |
| Image signing | OCI labels for provenance |
| Watchdog | Supervisor health monitoring via `/api/health` |
| Backup | `cold` — addon stops during backup for data consistency |
| Lockfile | `--frozen-lockfile` enforced in Dockerfile (both build + prod stages) |
| HA checklist | Passes both [component](https://developers.home-assistant.io/docs/creating_component_code_review) and [platform](https://developers.home-assistant.io/docs/creating_platform_code_review) checklists |
| CODEOWNERS | Review required for auth, middleware, rate-limit, HA integration paths |
| Dependabot | Weekly scans for npm, GitHub Actions, and Docker base images |

## Notification System

**Architecture:** Multi-channel notification dispatch with per-user preferences, platform-specific enrichments, and a due-date reminder scheduler.

| Component | File | Purpose |
|-----------|------|---------|
| Dispatch Engine | `src/pages/api/tasks/[id].ts` | Sends sidebar + mobile push on assignment/P1 escalation |
| Due-Date Scheduler | `src/domains/notifications/due-date-reminders.ts` | 5-min interval, sends reminders for tasks due within configurable window |
| Mark Done Handler | `src/domains/ha/ha-connection.ts` | Handles actionable notification buttons (status → done) |
| Settings UI | `src/components/settings/SettingsGeneral.astro` | Per-user toggles, channel config, reminder window |
| Settings API | `src/pages/api/settings.ts` | Persists `notification_preferences` key |

**Notification Channels:**

| Channel | Service | Features |
|---------|---------|----------|
| Sidebar Bell | `persistent_notification.create` | Markdown, deep links, auto-dismiss on completion |
| Mobile Push | `notify.mobile_app_*` | Channels (urgent/tasks/reminders), importance, interruption-level |
| Calendar Reminder | `calendar.create_event` | 15-min event propagates to phone calendars |

**Platform Enrichments:**

| Platform | Feature | Implementation |
|----------|---------|----------------|
| Android | Heads-up (P1) | `importance: "high"`, channel `meitheal_urgent` |
| Android | Accent color | `color: "#10b981"` (green) / `"#f59e0b"` (amber reminders) |
| Android | Actionable buttons | "Open Task" (URI), "✅ Mark Done" (event action) |
| iOS | Focus bypass (P1) | `interruption-level: "time-sensitive"` |
| iOS | Badge count | Open task count on HA app icon |

**Production Safety:**

| Concern | Mitigation |
|---------|------------|
| Memory leaks | Bounded `sentReminders` Set (500 max, bulk-prune 50) |
| Race conditions | `processing` flag in `finally` block |
| Crash prevention | All WS event handlers wrapped in try/catch |
| Settings thrashing | Cached with 5-min TTL (matches scheduler interval) |
| Module re-imports | Refs cached after first load |
| Schema overhead | `ensureSchema()` called once per process lifetime |
| SQL efficiency | Date-filtered queries (ISO + epoch fallback) |
| Input validation | TaskId regex + `encodeURIComponent` before fetch |

## Middleware (`src/middleware.ts`)

| Feature | Details |
|---------|---------|
| Ingress path rewriting | Rewrites HTML `href`/`src` + CSS `url()` for HA ingress proxy; OOM guard at 5MB |
| Settings cache | Regional settings cached with 60s TTL (avoids DB query per request) |
| CSP headers | Strict policy injected on every response |
| Regional settings | Reads cookies → sets `Astro.locals` (timezone, weekStart, dateFormat) |
| CSRF protection | Validates `Origin`/`Referer` on non-GET requests; rejects missing headers in standalone mode |
| Rate limiting | Token-bucket per IP on `/api/` routes; 10K entry cap with FIFO eviction |
| IP normalization | Port stripping, IPv6 bracket unwrapping, whitespace trim |
| Ingress context | `ingress-policy.ts` determines ingress path from `X-Ingress-Path` header |

## Ingress Double-Slash Fix (`scripts/serve.mjs`)

HA Supervisor can send requests with `//` paths. Astro's internal `collapseDuplicateTrailingSlashes()` normalizes these and issues a 301 redirect to `/`, which escapes the ingress iframe. The `serve.mjs` wrapper normalizes `req.url` **before** Astro processes it, preventing unsafe redirects.

## Astro Lifecycle Patterns

| Pattern | Usage |
|---------|---------|
| `<script is:inline>` | In-place execution (no ES module hoisting), used for tab switching |
| `astro:page-load` | Fires after every navigation (initial + ViewTransition swap) |
| Dual-init | `initFn()` + `addEventListener('astro:page-load', initFn)` for reliability |
| `transition:persist` | Sidebar persists across navigations |
| `<ViewTransitions fallback="swap" />` | Client-side navigation with prefetch |
| Global fetch wrapper | `Layout.astro` monkey-patches `fetch()` to prefix requests with ingress path |
| Ingress state persistence | Inline `<head>` script reads `sessionStorage` and redirects to saved route (if < 60s old); processed `<body>` script saves route + scroll on navigation, scroll (debounced), and `beforeunload` — `ingress-state-persistence.ts` |

---

*Stack analysis: 2026-03-06 — v0.3.0 Security hardening audit (CSRF fix, rate limiter caps, settings cache, OOM guard, HA publishing checklist compliance)*
