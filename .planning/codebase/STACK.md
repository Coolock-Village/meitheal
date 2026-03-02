# Technology Stack

**Analysis Date:** 2026-02-28
**Commit:** 9b9f2ab

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
| `@astrojs/sitemap` | 3.7 | SEO |
| Drizzle ORM | 0.45 | Schema + queries |
| `@libsql/client` | 0.15 | SQLite driver (libSQL) |
| `drizzle-kit` | 0.31 | Migration tooling |
| Playwright | 1.58 | E2E + integration tests |
| `@axe-core/playwright` | 4.11 | Accessibility testing |
| Zod | 3.24 | Runtime validation |
| undici | 7.16 | HTTP client |

## Configuration

**Environment Variables:**

| Variable | Required | Purpose |
|----------|----------|---------|
| `MEITHEAL_DB_URL` | Yes | SQLite path (default: `file:/data/meitheal.db`) |
| `SUPERVISOR_TOKEN` | Auto | HA supervisor auth |
| `HA_BASE_URL` + `HA_TOKEN` | Alt | HA auth fallback |
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
| Production (HA) | HA OS, amd64/aarch64/armv7, 128MB Node heap, `/data/` write access |
| Cloud (future) | Cloudflare Workers + D1 |

## Deployment (HA Addon)

> **⚠️ Pushing code to GitHub does NOT deploy to HA.** You must push a version tag to trigger the CI Docker image build, then restart the addon.

### Deploy Flow

| Step | Action | Details |
|------|--------|---------|
| 1. Bump version | Edit `meitheal-hub/config.yaml` → `version:` | Must match tag (e.g. `0.1.25` → `v0.1.25`) |
| 2. Commit + tag | `git commit` then `git tag v0.1.25` | Tag triggers CI |
| 3. Push | `git push origin main --tags` | Pushes code + tag to GitHub |
| 4. CI builds | `publish-addon-images.yml` runs automatically | Builds amd64 + aarch64 Docker images |
| 5. Restart addon | HA → Settings → Add-ons → Meitheal Hub → Restart | Pulls new image |

### CI Workflow: `publish-addon-images.yml`

- **Triggers**: `v*` tag push, or manual `workflow_dispatch`
- **Builds**: amd64 + aarch64 via `docker buildx`
- **Pushes to**: GHCR (`ghcr.io/coolock-village/meitheal-hub-{arch}`) + Docker Hub (`coolockvillage/meitheal-hub-{arch}`)
- **Validates**: release tag matches `config.yaml` version

### Local Build (alternative): `./meitheal-hub/build-push-dev.sh`

- Requires `docker buildx` + `docker login -u coolockvillage`
- Host OS has `podman` only — use distrobox or CI instead

### Key Files

| File | Purpose |
|------|---------|
| `meitheal-hub/Dockerfile` | Multi-stage: pnpm install → Astro build → Alpine runtime |
| `meitheal-hub/config.yaml` | HA addon config (version, ingress, arch, options schema) |
| `meitheal-hub/run.sh` | Addon entrypoint (reads HA options, starts Node) |
| `meitheal-hub/build-push-dev.sh` | Local build + push script |
| `repository.yaml` | HA addon repository metadata |
| `.github/workflows/publish-addon-images.yml` | CI Docker build + push |

---

*Stack analysis: 2026-03-02 @ 2a96e5d*
