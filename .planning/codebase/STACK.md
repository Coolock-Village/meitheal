# Technology Stack

**Analysis Date:** 2026-03-04
**Version:** 0.1.55

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

## Security & Hardening

| Area | Implementation |
|------|----------------|
| CSP | Strict policy — no external CDN allowed (`font-src 'self'`, `style-src 'self' 'unsafe-inline'`) |
| Error responses | All API catch blocks return generic `"Internal server error"` (CWE-209) |
| Viewport | WCAG 2.1 SC 1.4.4 compliant (no `user-scalable=0`) |
| Image signing | OCI labels for provenance |
| Watchdog | Supervisor health monitoring via `/api/health` |
| Backup | `cold` — addon stops during backup for data consistency |
| Lockfile | `--frozen-lockfile` enforced in Dockerfile (both build + prod stages) |

## Middleware (`src/middleware.ts`)

| Feature | Details |
|---------|---------|
| Ingress path rewriting | Rewrites HTML `href`/`src` + CSS `url()` for HA ingress proxy |
| CSP headers | Strict policy injected on every response |
| Regional settings | Reads cookies → sets `Astro.locals` (timezone, weekStart, dateFormat) |
| CSRF protection | Validates `Origin` header on non-GET requests |
| Rate limiting | Token-bucket per IP on `/api/` routes |
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

---

*Stack analysis: 2026-03-04 — v0.2.6 ingress redirect fix*
