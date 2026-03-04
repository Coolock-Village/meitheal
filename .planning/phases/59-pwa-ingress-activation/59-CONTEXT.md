# Phase 59: PWA Ingress Activation - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers a fully functional PWA that works both standalone and behind HA Supervisor ingress. The PWA service worker was built (Phase 03) but never wired to the running app — `registerServiceWorker()` is exported but never called. This phase connects all existing PWA infrastructure and adds the missing install/update UX.

</domain>

<decisions>
## Implementation Decisions

### Service Worker Registration
- Wire `registerServiceWorker()` call in Layout.astro via DOMContentLoaded
- Use `navigator.serviceWorker.ready` for reliable ingress path messaging
- Keep existing SW caching strategies (cache-first static, network-first API)

### Install Prompt UX
- Capture `beforeinstallprompt` event globally on `window.__pwa_install_prompt`
- Create a dismissible bottom banner (PwaInstallBanner.astro) — 7-day dismiss cooldown
- Add install button in Settings > System PWA row
- Fire `meitheal-pwa-installed` custom event on `appinstalled`

### SW Update UX
- Listen for `meitheal-sw-update` custom event (already dispatched by sw-register.ts)
- Show persistent toast with "Update available — Refresh" button
- Call `activateWaitingSw()` from sw-register.ts on user confirmation

### Versioning
- Sync `CACHE_VERSION` in sw.js to match `config.yaml` version (`0.1.58`)
- Add `GET_VERSION` message handler in SW for Settings to query

### Platform Meta Tags
- Add `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style`
- Fix `theme-color` meta tag to `#0f172a` (match manifest)

### Manifest Stability
- Set manifest `id` to `/` (not ingress-prefixed) to prevent duplicate installations
- Add `lang: "en"` to manifest base

### Claude's Discretion
- Banner design details (positioning, animation, glass effect intensity)
- Toast timing and auto-dismiss duration
- Whether to add `screenshots` to manifest in this phase or defer

</decisions>

<specifics>
## Specific Ideas

- Use existing toast system in Layout.astro for SW update notifications
- PwaInstallBanner should match the existing card/glass aesthetic
- Settings PWA row should show SW version to help with debugging
- The banner should not appear inside HA ingress on HTTP (since PWA won't work anyway)

</specifics>

<deferred>
## Deferred Ideas

- Push notification subscription wiring (separate concern, needs server-side VAPID keys)
- iOS splash screen images (`apple-touch-startup-image`)
- Manifest `screenshots` for Play Store
- i18n for manifest name/description
- Real Playwright PWA E2E browser tests (need HTTPS context)
- Background sync queue processing (currently only broadcasts)

</deferred>

---

*Phase: 59-pwa-ingress-activation*
*Context gathered: 2026-03-04*
