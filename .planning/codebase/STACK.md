# Technology Stack

**Analysis Date:** 2026-02-28

## Languages

**Primary:**
- TypeScript 5.8 - All application and test code
- JavaScript (ESM `.mjs`) - Build scripts and migrations

**Secondary:**
- Bash - Add-on runtime (`run.sh`), CI scripts
- SQL - Drizzle migration files
- YAML - HA config, CI workflows, content schemas

## Runtime

**Environment:**
- Node.js 22 (CI and production)
- pnpm 10.8.0 (workspace-based monorepo)

**Package Manager:**
- pnpm with workspace protocol (`workspace:*`)
- Lockfile: `pnpm-lock.yaml` (present)
- Workspace config: `pnpm-workspace.yaml`

## Frameworks

**Core:**
- Astro 5.18 - SSR web framework (server output mode)
- `@astrojs/node` 9.5 - Node standalone adapter for HA runtime
- `@astrojs/mdx` 4.3 - MDX content support
- `@astrojs/tailwind` 6.0 - Styling
- `@astrojs/sitemap` 3.7 - SEO

**Database:**
- Drizzle ORM 0.45 - Schema and query builder
- `@libsql/client` 0.15 - SQLite driver (libSQL)
- `drizzle-kit` 0.31 - Migration tooling

**Testing:**
- Playwright 1.58 - E2E and integration tests
- `@axe-core/playwright` 4.11 - Accessibility testing

**Validation:**
- Zod 3.24 - Runtime schema validation

**HTTP:**
- undici 7.16 - HTTP client for external service calls

## Key Dependencies

**Critical:**
- `drizzle-orm` + `@libsql/client` - All persistence
- `astro` - Web runtime and routing
- `zod` - Input validation across API endpoints

**Infrastructure:**
- `undici` - HTTP client for HA and vikunja-compat calls
- `@astrojs/node` - Production server adapter

## Configuration

**Environment:**
- `MEITHEAL_DB_URL` - SQLite database path (default: `file:/data/meitheal.db`)
- `SUPERVISOR_TOKEN` / `HA_BASE_URL` + `HA_TOKEN` - HA auth
- `MEITHEAL_VIKUNJA_API_TOKEN` / `MEITHEAL_VIKUNJA_API_TOKENS` - Compat auth
- `MEITHEAL_LOG_LEVEL`, `MEITHEAL_LOG_REDACTION`, `MEITHEAL_AUDIT_ENABLED` - Logging
- `LOKI_URL` - Observability pipeline

**Build:**
- `astro.config.mjs` - Astro configuration
- `drizzle.config.ts` - Database migration config
- `tsconfig.base.json` - Shared TypeScript config (root)
- `tsconfig.json` per workspace package

## Platform Requirements

**Development:**
- Node.js 22+, pnpm 10.8+
- SQLite-compatible filesystem

**Production (HA):**
- Home Assistant OS with add-on support
- `amd64` / `aarch64` / `armv7` architectures
- 128MB max old space for Node.js runtime
- SQLite file storage at `/data/meitheal.db`

---

*Stack analysis: 2026-02-28*
