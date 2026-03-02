---
phase: 43
name: HA Security Hardening
goal: Address 10 medium-severity persona audit findings for security, observability, and resilience
status: planned
---

# Phase 43 Context — HA Security Hardening

## Goal

Address persona audit findings #1, #4, #7, #12, #14, #17, #25, #32, #34, #39 — all ⚠️ Med severity items deferred to Phase 5 backlog that are now in scope for the HA addon track.

## Background

The 50-persona audit identified 10 medium-severity issues. With the HA addon now running live, these become blocking for production use.

## Decisions

- **timingSafeEqual** for bearer auth (#1) — use `node:crypto` timingSafeEqual
- **CSRF tokens** on POST/PUT/DELETE (#4) — per-session tokens stored server-side
- **Optimistic locking** with 409 on stale `updated_at` (#7) — API returns 409 if client's `updated_at` is stale
- **Sync queue 7-day TTL** (#12) — auto-cleanup old entries
- **Conflict notification toasts** (#14) — UI feedback on sync conflicts
- **Content hash in SW precache** (#17) — revision hashing for cache busting
- **aria-live for sync events** (#25) — screen reader announcements
- **Structured logging** (#32) — already done via `@meitheal/domain-observability`
- **Domain events from CRUD** (#34) — already done via `ha-events.ts`
- **D1 unavailability fallback** (#39) — 503 + cached response

## Deferred

- IP allowlisting for HA internal traffic (#6) — low severity
- OpenAPI spec (#8) — low severity, post-release
- iOS splash screens (#19) — low severity

## Persona Audit Alignment

| # | Persona | Finding | Plan |
|---|---------|---------|------|
| 1 | Security Architect | String comparison for bearer auth | timingSafeEqual |
| 4 | Penetration Tester | No CSRF protection | Per-session CSRF tokens |
| 7 | API Designer | No 409 on stale updated_at | Optimistic locking |
| 12 | Data Engineer | No sync queue TTL | 7-day auto-cleanup |
| 14 | Conflict Specialist | No conflict notification | Toast UI |
| 17 | Performance Eng | No precache revision hash | Content hash |
| 25 | Screen Reader Eng | No aria-live for sync | Wired to sync events |
| 32 | Logging Architect | Unstructured logs | ✅ Already addressed in Phase 28/44 |
| 34 | Audit Trail Eng | No domain events | ✅ Already addressed in Phase 44 |
| 39 | Chaos Engineer | No D1 unavailability fallback | 503 + cache |
