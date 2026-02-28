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

---

*Stack analysis: 2026-02-28 @ 9b9f2ab*
