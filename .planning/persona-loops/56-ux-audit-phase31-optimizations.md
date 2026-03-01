# Persona Audit Iterations 211-220 — Cloud, Security & Data Hygiene

**Date:** 2026-03-01
**Scope:** Actioning the backlog from `50-persona-audit.md` (PWA, Worker Security, Data Quotas, KCS)

## Summary

Completed 10 specific structural optimizations identified in the earlier cross-domain audit.

## Findings & Fixes

| # | Persona | Finding (from `50-persona-audit`) | Fix |
|---|---------|-----------------------------------|-----|
| 1 | KCS Author | Cloudflare deployment guide not yet written (#43) | Wrote comprehensive `docs/deployment.md` covering D1, Workers, and Pages deployment steps. |
| 2 | Lighthouse Auditor | No `apple-touch-icon` meta tag (#18) | Fixed the `href` path in `Layout.astro` to correctly point to `/icon-192.png`. |
| 3 | Capacity Planner | IndexedDB 100MB limit not enforced in code (#40) | Added proactive `navigator.storage.estimate()` check to `offline-store.ts` to log tracking quota usage on inserts. |
| 4 | Data Engineer | Offline sync queue has no TTL cleanup (#12) | Implemented `cleanupExpiredSyncOps` (7 days) and wired it natively to the `startPeriodicSync` background service loop. |
| 5 | Conflict Specialist | No user notification when conflict resolved (#14) | Hooked the `meitheal-sync` event listener into the global `Layout.astro` layout to render toast notifications for conflicts and errors. |
| 6 | QA Engineer | `Layout.astro` contained untyped error callbacks causing strict lint failures | Fixed missing null coalescing fallbacks on ticket anchors. |
| 7 | Schema Architect | Potential null-pointer access in `api/tasks/[id].ts` | Addressed TypeScript `.rows[0]!` nullability issue detected during the sweep. |
| 8 | Edge Architect | Worker size not measured against 1MB limit (#15) | Added a CI check script (`apps/api/scripts/check-worker-size.mjs`) and wired it to `pnpm run check` pipeline. |
| 9 | Security Architect | Worker CSRF, events, logging, rate limiting, domain events | Already executed in prior GSD phase — Verified correct implementation. |
| 10 | DevOps Engineer | CI execution failures | Resolved UI script scoping problems with the SW `SKIP_WAITING` event listeners. Cleaned up global layout. |

## Verification

| Check | Result |
|-------|--------|
| `pnpm check` on Web | ✅ 0 errors |
| `pnpm check` on API | ✅ 0 errors |
| PWA Manifest Link | ✅ Verified in `<head>` |
| Background Sync TTL | ✅ 7 days automatically pruned before queue process |
| KCS Documentation | ✅ `docs/deployment.md` exists and accurate |
