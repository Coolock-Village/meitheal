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

| Step | Command / Action | Notes |
|------|-----------------|-------|
| 1. Build & push Docker images | `./meitheal-hub/build-push-dev.sh` | Builds amd64 + aarch64, pushes to Docker Hub |
| 2. Tagged release | `./meitheal-hub/build-push-dev.sh v0.3.0` | Also pushes `:latest` tag |
| 3. Restart addon in HA | Settings → Add-ons → Meitheal Hub → Restart | Pulls new image on restart |

**Docker Hub:** `coolockvillage/meitheal-hub-{arch}` (amd64, aarch64)

**Key files:**

| File | Purpose |
|------|---------|
| `meitheal-hub/Dockerfile` | Multi-stage build: pnpm install → Astro build → Alpine runtime |
| `meitheal-hub/config.yaml` | HA addon config (version, ingress, arch, options schema) |
| `meitheal-hub/run.sh` | Addon entrypoint (reads HA options, starts Node server) |
| `meitheal-hub/build-push-dev.sh` | Build + push script (requires `docker buildx` + Docker Hub creds) |
| `repository.yaml` | HA addon repository metadata |

**Prerequisites:**
- `docker login -u coolockvillage` (PAT as password)
- `docker buildx` for multi-arch builds
- Host OS has `podman` only — Docker available via distrobox or remote

> **⚠️ Pushing code to GitHub does NOT deploy to HA.** The addon pulls pre-built Docker images from Docker Hub. You must run the build-push script, then restart the addon.

---

*Stack analysis: 2026-03-02 @ 6c3c9fd*
