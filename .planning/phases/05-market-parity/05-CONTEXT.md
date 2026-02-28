# Phase 5: Market Parity — Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

## Phase Boundary

Phase 5 delivers **market parity** with Vikunja + Super Productivity core workflows, resolves all deferred 50-persona audit findings, and closes structural gaps from `docs/analysis/gap-matrix.md`.

## Consolidated Deferred Backlog

### From 50-Persona Audit (Medium Severity)

| # | Finding | Source |
|---|---------|--------|
| 1 | `timingSafeEqual` for Worker bearer auth | Audit #1 |
| 4 | CSRF protection on Workers POST routes | Audit #4 |
| 7 | PUT routes return 409 on stale `updated_at` | Audit #7 |
| 12 | Sync queue TTL cleanup (7-day) | Audit #12 |
| 14 | User notification on conflict resolution | Audit #14 |
| 17 | Precache revision hashing for SW | Audit #17 |
| 25 | `aria-live` region wired to sync events | Audit #25 |
| 32 | Structured logging in Worker | Audit #32 |
| 34 | Domain events from Worker CRUD | Audit #34 |
| 39 | D1 unavailability fallback (503 + cache) | Audit #39 |
| 50 | Shared types package extraction | Audit #50 |

### From 50-Persona Audit (Low Severity)

| # | Finding | Action |
|---|---------|--------|
| 5 | Hash IPs in rate limiter | Implement |
| 8 | OpenAPI spec for Worker routes | Generate |
| 11 | D1 down migration | Add |
| 18 | `apple-touch-icon` meta tag | Add to layout |
| 19 | iOS splash screen config | Add to manifest |
| 21 | Manifest screenshots for Play Store | Add |
| 22 | Stale data age indicator | Add to sync UI |
| 29 | `wrangler deploy` CI step | Add to pipeline |
| 33 | GDPR data deletion endpoint | Implement |
| 42 | Worker API reference doc | Write |
| 44 | `wrangler dev` in README | Add |

### From ROADMAP Phase 5

- Rich custom fields + forms logic with conditional UI
- Portfolio/workload/priority workflow (RICE/DRICE/HEART overlays)
- Passkeys/WebAuthn authentication
- Obsidian sync integration
- Rich links (unfurl)
- Parity verification against `parity-spec.md`

### From Gap Matrix

- Task views (list/kanban/table/gantt) — target: Strong
- Forms + custom-field logic — target: Strong  
- Portfolio/workload/capacity planning — target: Strong
- No-code automation depth — target: Strong
- Mobile/offline/collab parity improvements

## Decisions

1. **Wave structure:** 4 waves, security-first, then features, then docs
2. **Shared types:** Extract `@meitheal/shared-types` package for Worker/Node parity
3. **Custom fields:** Zod-validated field definitions, stored in tasks table as JSON column
4. **CSRF:** Origin + SameSite cookie validation on Workers
5. **timingSafeEqual:** Use Web Crypto `subtle.timingSafeEqual` equivalent for Workers
6. **Structured logging:** Port compat logger pattern to Worker context
7. **Domain events:** Worker CRUD emits domain events through integration bus
8. **D1 fallback:** Return 503 with `Retry-After` header when D1 is unreachable

## What's Deferred (Beyond Phase 5)

- Push notifications (separate RFC needed)
- Multi-tab sync via BroadcastChannel
- Durable Objects for real-time collaboration
- KV caching layer
- Full Obsidian vault sync (deep integration)
- Enterprise SSO/SCIM

---

*Phase: 05-market-parity*
