# 50-Persona PWA Ingress Audit

**Date:** 2026-03-04
**Scope:** PWA features not showing in HA ingress — full domain audit
**Root Cause:** `registerServiceWorker()` exported from `sw-register.ts` but never called anywhere. No `beforeinstallprompt` handler. PWA is dead code.

## Audit Matrix

| # | Persona | Domain | Finding | Severity | Status |
|---|---------|--------|---------|----------|--------|
| 1 | PWA Engineer | Registration | `registerServiceWorker()` never called — SW is dead code | 🛑 P0 | Open |
| 2 | PWA Engineer | Install | No `beforeinstallprompt` event listener — install prompt never captured | 🛑 P0 | Open |
| 3 | PWA Engineer | Install | No install button in Settings or anywhere in UI | 🛑 P0 | Open |
| 4 | SW Developer | Cache | `CACHE_VERSION` hardcoded to `0.1.25` but app is `0.1.58` — stale cache invalidation | 🛑 P1 | Open |
| 5 | Manifest Expert | Manifest | `href="/manifest.webmanifest"` in Layout.astro is static — middleware regex rewrites it but crossorigin attribute may interfere | ⚠️ P2 | Open |
| 6 | HA Addon Specialist | Ingress | SW scope `/api/hassio_ingress/{token}/` requires HTTPS — most HA internal traffic is HTTP | ⚠️ P2 | Open |
| 7 | Security Engineer | HTTPS | `isPwaSupported()` correctly gates on `window.isSecureContext` — but no fallback UI to explain to user | ⚠️ P3 | Open |
| 8 | iOS Developer | Platform | No `apple-mobile-web-app-capable` meta tag | ⚠️ P3 | Open |
| 9 | iOS Developer | Platform | No `apple-mobile-web-app-status-bar-style` meta tag | ⚠️ P3 | Open |
| 10 | iOS Developer | Platform | No iOS splash screen (`apple-touch-startup-image`) meta tags | ℹ️ P4 | Open |
| 11 | Android Expert | Platform | No `screenshots` array in manifest — Play Store installability hint | ℹ️ P4 | Open |
| 12 | UX Designer | Install | No install banner/prompt UI component anywhere in the app | 🛑 P1 | Open |
| 13 | UX Designer | Install | Settings PWA status (SettingsSystem.astro) is read-only — no install action | ⚠️ P2 | Open |
| 14 | UX Designer | Offline | Offline page (`offline.astro`) has no ingress-aware links | ⚠️ P3 | Open |
| 15 | UX Researcher | Install | No user education about PWA benefits anywhere | ℹ️ P4 | Open |
| 16 | Performance Engineer | Cache | SW precaches all pages on install — heavy on first load | ℹ️ P4 | Open |
| 17 | Performance Engineer | Cache | No content-hash in precache URLs — stale assets between versions | ⚠️ P3 | Open |
| 18 | Lighthouse Auditor | PWA | Missing `theme-color` meta tag value mismatch (`#1a1a2e` in Layout vs `#0f172a` in manifest) | ⚠️ P2 | Open |
| 19 | Lighthouse Auditor | PWA | No `maskable` purpose on primary icon (only on dedicated maskable icon) | ℹ️ P5 | Open |
| 20 | Lighthouse Auditor | PWA | No `related_applications` or `prefer_related_applications` in manifest | ℹ️ P6 | Open |
| 21 | Accessibility Engineer | Offline | Offline page lacks `role="alert"` on status message | ℹ️ P5 | Open |
| 22 | Accessibility Engineer | Install | No `aria-live` announcement when install prompt appears | ℹ️ P5 | Open |
| 23 | i18n Engineer | PWA | Manifest `name`/`short_name`/`description` not localized | ℹ️ P5 | Open |
| 24 | i18n Engineer | Offline | Offline page text is hardcoded English | ℹ️ P5 | Open |
| 25 | HA Theme Engineer | Manifest | `background_color`/`theme_color` in manifest don't respond to HA theme | ℹ️ P5 | Open |
| 26 | HA Ingress Specialist | Registration | SW `SET_INGRESS_PATH` message only sent once — if SW restarts, ingress path lost | ⚠️ P3 | Open |
| 27 | HA Ingress Specialist | Manifest | Manifest `id` uses ingress path — may cause multiple PWA installations per token | ⚠️ P2 | Open |
| 28 | HA Ingress Specialist | Scope | `Service-Worker-Allowed: /` header set unconditionally — correct behavior | ✅ OK | N/A |
| 29 | HA Ingress Specialist | Rewriting | Middleware regex `/(href|src|action)=["']\/(?!\/)/g` correctly rewrites absolute paths | ✅ OK | N/A |
| 30 | Service Worker Expert | Lifecycle | No `navigator.serviceWorker.ready` promise used — can't guarantee SW is active before sending messages | ⚠️ P3 | Open |
| 31 | Service Worker Expert | Update | Update check interval (60s) is aggressive for HA addon context | ℹ️ P5 | Open |
| 32 | Service Worker Expert | Update | Update prompt (`meitheal-sw-update` custom event) dispatches but no UI listens for it | 🛑 P1 | Open |
| 33 | Push Notification Expert | Push | Push handler exists in SW but no push subscription code anywhere | ℹ️ P4 | Open |
| 34 | Push Notification Expert | Push | Notification icon path uses `ingressPath` — correct for HA context | ✅ OK | N/A |
| 35 | Background Sync Expert | Sync | `SYNC_TAG` handler only broadcasts — no actual sync queue processing | ℹ️ P4 | Open |
| 36 | Caching Strategist | Strategy | Cache-first for static assets is correct | ✅ OK | N/A |
| 37 | Caching Strategist | Strategy | Network-first for API routes is correct | ✅ OK | N/A |
| 38 | Caching Strategist | Strategy | Navigation handler with offline fallback is correct | ✅ OK | N/A |
| 39 | Test Engineer | E2E | `pwa-offline.spec.ts` tests are unit-level contract tests, not real browser PWA tests | ℹ️ P4 | Open |
| 40 | Test Engineer | E2E | No Playwright test for actual SW registration or install prompt | ℹ️ P4 | Open |
| 41 | DevOps Engineer | Versioning | SW `CACHE_VERSION` manually set — should read from config.yaml or be injected at build time | ⚠️ P2 | Open |
| 42 | KCS Author | Documentation | `pwa-offline-guide.md` claims full ingress compatibility but SW is never registered | ⚠️ P2 | Open |
| 43 | KCS Author | Documentation | `pwa/README.md` is a placeholder ("iteration 2") | ℹ️ P5 | Open |
| 44 | Domain Architect | DDD | `sw-register.ts` in `domains/offline/` — correct bounded context | ✅ OK | N/A |
| 45 | Domain Architect | DDD | `manifest.webmanifest.ts` in `pages/` — correct as API route | ✅ OK | N/A |
| 46 | Code Quality | Dead Code | `activateWaitingSw()` exported but never called | ⚠️ P3 | Open |
| 47 | Code Quality | Dead Code | `isPwaSupported()` exported but never called externally | ⚠️ P3 | Open |
| 48 | Code Quality | Dead Code | `SwUpdateEventDetail` type exported but never consumed | ⚠️ P3 | Open |
| 49 | Product Manager | Feature Gap | PWA was Phase 03 (marked complete) but core registration never actually wired | 🛑 P0 | Open |
| 50 | Product Manager | Feature Gap | Manifest shortcuts exist but are unreachable without install | 🛑 P1 | Open |

## Severity Summary

| Severity | Count | Description |
|----------|-------|-------------|
| 🛑 P0 (Blocker) | 4 | SW not registered, no install prompt, no install button, Phase 03 falsely marked complete |
| 🛑 P1 (Critical) | 3 | Stale cache version, no install UI, no update prompt UI |
| ⚠️ P2 (Major) | 6 | Manifest link, HTTPS/ingress, theme mismatch, manifest id, docs inaccurate, version sync |
| ⚠️ P3 (Minor) | 7 | iOS meta tags, offline page links, ingress path persistence, dead code exports |
| ℹ️ P4 (Improvement) | 6 | Splash screens, screenshots, push subscription, precache weight, real E2E tests |
| ℹ️ P5-P6 (Nice to have) | 10 | i18n, a11y polish, theme-aware manifest, update interval tuning |

## Critical Path (Must Fix for PWA to Work)

1. **Wire `registerServiceWorker()`** — call it from Layout.astro on DOMContentLoaded
2. **Add `beforeinstallprompt` handler** — capture and defer the install event
3. **Add PWA install UI** — button in Settings + optional banner
4. **Fix `CACHE_VERSION`** — sync with config.yaml version
5. **Sync `theme-color` meta tag** with manifest
6. **Add SW update prompt UI** — handle `meitheal-sw-update` custom event
7. **iOS meta tags** — `apple-mobile-web-app-capable`, `status-bar-style`

## Medium Priority (Should Fix)

8. **Fix manifest `id`** — use stable value not tied to ingress path
9. **Update KCS docs** — `pwa-offline-guide.md` to reflect actual state
10. **SW `SET_INGRESS_PATH` resilience** — handle SW restart
11. **Use `navigator.serviceWorker.ready`** for reliable messaging
12. **Version injection** — automate CACHE_VERSION from build

## Deferred (P4-P6)

- Screenshots in manifest
- iOS splash screens
- Push subscription wiring
- i18n for manifest/offline page
- Real Playwright PWA E2E tests
