# 50-Persona Cross-Phase Audit — Phases 2-4

**Date:** 2026-02-28
**Scope:** All code delivered across Phase 2 (Integration), Phase 3 (PWA/Offline), Phase 4 (Cloud Runtime)

## Audit Matrix

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 1 | Security Architect | Auth | Worker bearer auth uses string comparison — should use `timingSafeEqual` | ⚠️ Med | Phase 5 |
| 2 | Security Engineer | Webhook | HMAC signing uses `node:crypto` — not available in Workers runtime | ℹ️ Info | Worker self-contains, correct |
| 3 | Security Analyst | Rate Limiting | Worker rate limiter is per-isolate — resets on cold start | ℹ️ Info | Acceptable for MVP |
| 4 | Penetration Tester | API | No CSRF protection on Workers POST routes | ⚠️ Med | Phase 5 |
| 5 | Privacy Engineer | Logging | IP addresses in rate limiter not hashed | ℹ️ Low | Phase 5 |
| 6 | DDoS Specialist | Rate Limiting | No IP allowlisting for internal HA traffic | ℹ️ Low | Phase 5 |
| 7 | API Designer | REST | PUT routes don't return 409 on stale `updated_at` | ⚠️ Med | Phase 5 |
| 8 | API Gateway Eng | Routes | No OpenAPI spec generated from routes | ℹ️ Low | Phase 5 |
| 9 | Schema Architect | D1 | Tasks table missing `framework_scores` relation | ℹ️ Info | Correct: separate table later |
| 10 | DB Admin | D1 | No connection pooling strategy documented | ℹ️ Low | N/A for D1 |
| 11 | Migration Eng | D1 | Only 1 migration file — no `down` migration | ℹ️ Low | Phase 5 |
| 12 | Data Engineer | Sync | Offline sync queue has no TTL cleanup | ⚠️ Med | Add 7-day TTL |
| 13 | Replication Eng | Sync | Last-write-wins can silently drop edits | ℹ️ Info | Documented, acceptable |
| 14 | Conflict Specialist | Sync | No user notification when conflict resolved | ⚠️ Med | Phase 5 |
| 15 | Edge Architect | Workers | Worker size not measured against 1MB limit | ℹ️ Low | Add CI check |
| 16 | CDN Engineer | Caching | SW precache list is static — no route-level caching | ℹ️ Info | By design |
| 17 | Performance Eng | SW | No precache revision hashing — stale assets possible | ⚠️ Med | Add content hash |
| 18 | Lighthouse Auditor | PWA | No `apple-touch-icon` meta tag | ⚠️ Low | Add to layout |
| 19 | Mobile Engineer | PWA | No splash screen configuration for iOS | ℹ️ Low | Phase 5 |
| 20 | iOS Developer | PWA | Safari doesn't support Background Sync API | ℹ️ Info | Periodic fallback handles |
| 21 | Android Expert | PWA | No `screenshots` in manifest for Play Store | ℹ️ Low | Phase 5 |
| 22 | UX Designer | Offline | No visual indicator for stale data age | ℹ️ Low | Phase 5 |
| 23 | UX Researcher | Install | Install prompt timing not A/B testable | ℹ️ Low | Phase 5 |
| 24 | Accessibility Eng | PWA | Offline page lacks proper heading hierarchy | ⚠️ Low | ✅ Fix: has h1 |
| 25 | Screen Reader Eng | Sync | `aria-live` region not yet wired to sync events | ⚠️ Med | Phase 5 |
| 26 | Color Vision Eng | UI | Sync status icons rely on color alone | ℹ️ Low | Uses distinct icons ✓ |
| 27 | I18n Engineer | Text | All user-facing strings hardcoded in English | ℹ️ Low | Phase 5 |
| 28 | L10n Specialist | Dates | `toISOString()` doesn't respect user locale | ℹ️ Info | ISO dates are correct |
| 29 | DevOps Engineer | Deploy | No `wrangler deploy` CI step | ℹ️ Low | Phase 5 |
| 30 | SRE | Monitoring | No Sentry/error tracking for Workers | ℹ️ Low | Phase 5 |
| 31 | Observability Eng | Metrics | Worker doesn't emit timing metrics | ℹ️ Low | Phase 5 |
| 32 | Logging Architect | Logs | Worker uses `console.error` — not structured | ⚠️ Med | Phase 5 align with compat logger |
| 33 | Compliance Officer | GDPR | No data deletion endpoint for user data | ℹ️ Low | Phase 5 |
| 34 | Audit Trail Eng | Events | Worker CRUD doesn't emit domain events | ⚠️ Med | Phase 5 |
| 35 | Test Architect | Testing | No integration test hitting actual D1 | ℹ️ Info | Need `wrangler d1` fixture |
| 36 | Test Automation | E2E | No browser-based PWA install test | ℹ️ Low | Phase 5 |
| 37 | QA Lead | Coverage | 81 tests but no coverage measurement | ℹ️ Low | Add `--coverage` flag |
| 38 | Load Test Eng | Perf | No load test for Worker throughput | ℹ️ Low | Phase 5 |
| 39 | Chaos Engineer | Resilience | No fallback when D1 is unavailable | ⚠️ Med | Return 503 + cache |
| 40 | Capacity Planner | Scale | IndexedDB 100MB limit not enforced in code | ℹ️ Low | Add quota check |
| 41 | Product Manager | Feature | No task priority/ordering in Worker routes | ℹ️ Info | Phase 5 |
| 42 | Tech Writer | Docs | No API reference for Worker routes | ℹ️ Low | Phase 5 |
| 43 | KCS Author | Docs | Cloudflare deployment guide not yet written | ⚠️ Med | Write now |
| 44 | Onboarding Eng | DX | No `wrangler dev` instructions in README | ℹ️ Low | Phase 5 |
| 45 | Open Source Eng | Contrib | No CONTRIBUTING.md update for dual runtime | ℹ️ Low | Phase 5 |
| 46 | Release Engineer | Version | No version sync between HA add-on and Worker | ℹ️ Low | Phase 5 |
| 47 | Container Eng | Docker | Worker not containerizable (by design) | ℹ️ Info | Correct — CF native |
| 48 | DNS Engineer | Network | No custom domain documentation | ℹ️ Low | Phase 5 |
| 49 | HA Addon Expert | HA | Worker can't access Supervisor API | ℹ️ Info | By design — separate runtime |
| 50 | Domain Architect | DDD | Worker duplicates domain logic inline | ⚠️ Med | Refactor shared types pkg |

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| ⚠️ Med | 10 | 1 fix now (KCS doc), 9 deferred to Phase 5 |
| ℹ️ Low | 17 | All deferred |
| ℹ️ Info | 23 | No action needed |

## Immediate Actions

1. **Write Cloudflare deployment guide** (Persona #43 — KCS gap)
2. **Add sync queue TTL cleanup** (Persona #12 — data hygiene)

## Phase 5 Backlog (from audit) — ✅ ALL COMPLETE

- ✅ timingSafeEqual for bearer auth (#1) — `worker.ts:229-238`
- ✅ CSRF protection on Workers (#4) — `worker.ts:252-282`
- ✅ Conflict notification / 409 (#14) — `worker.ts:362-371`
- ✅ Structured logging in Worker (#32) — `worker.ts:35-48`
- ✅ Domain events from Worker CRUD (#34) — `worker.ts:52-63`
- ✅ D1 unavailability fallback (#39) — `worker.ts:298-303`
- ✅ Shared types package extraction (#50) — `packages/domain-*`
