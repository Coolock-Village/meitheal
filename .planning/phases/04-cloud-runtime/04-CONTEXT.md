# Phase 4: Cloud Runtime — Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers a **Cloudflare Workers runtime** as an alternative deployment target alongside the existing HA add-on (Astro SSR + Node adapter). Users can deploy Meitheal to Cloudflare Pages/Workers for non-HA use cases (standalone cloud deployment, team/community use). Both runtimes share the same domain packages.

This phase does NOT change the HA add-on runtime. It adds a parallel deployment path using the existing `apps/api/` skeleton.

</domain>

<decisions>
## Implementation Decisions

### Dual Runtime Architecture
- HA runtime: `apps/web/` — Astro SSR + Node adapter + SQLite (unchanged)
- Cloud runtime: `apps/api/` — Cloudflare Workers + D1 (SQLite-compatible)
- Shared domain logic: `packages/*` — all domain packages work in both runtimes
- Entrypoint: `apps/api/src/worker.ts` (existing skeleton, extend it)

### D1 Database Adapter
- Create `packages/integration-core/src/d1-adapter.ts`
- Wraps Cloudflare D1 binding with same query interface as SQLite
- Reuse existing Drizzle schema — D1 is SQLite-compatible
- Migrations: shared SQL files, applied via `wrangler d1 migrations`

### API Route Mapping
- Mirror `/api/v1/*` compat routes from Astro web to Workers
- Same request/response contracts — clients don't know which runtime
- Rate limiter: reuse `rate-limiter.ts` from integration-core
- Auth: bearer token from environment variable (same as HA)

### Configuration
- `wrangler.toml` — Workers configuration, D1 binding, environment vars
- Environment: `MEITHEAL_RUNTIME=cloudflare` distinguishes from HA
- Secrets: API tokens via Cloudflare dashboard (not in code)

### Performance Constraints
- Workers: 10ms CPU time limit (free), 30ms (paid)
- D1: 5ms read, 20ms write typical latency
- Response body: 10MB max
- Script size: 1MB max (after gzip)

### What's Deferred
- Durable Objects for real-time sync — Phase 5
- KV for caching — Phase 5
- Custom domains — deployment concern, not code

</decisions>

---

*Phase: 04-cloud-runtime*
