# PWA Runtime

This directory is reserved for PWA-related components and client-side logic.

## Architecture

- **`sw.js`** (`public/`) — Service worker with cache-first static assets, network-first API, offline fallback, push notifications
- **`sw-register.ts`** (`domains/offline/`) — Ingress-aware SW registration, handles `SET_INGRESS_PATH` and update lifecycle
- **`manifest.webmanifest.ts`** (`pages/`) — Dynamic manifest API route, prefixes URLs with ingress path when behind HA
- **`PwaInstallBanner.astro`** (`components/pwa/`) — Dismissible bottom banner for install prompt
- **`offline.astro`** (`pages/`) — Offline fallback page

## HA Ingress Considerations

- SW scope and URL are prefixed with ingress path via `window.__ingress_path`
- Manifest `id` is stable (`/`) to prevent duplicate installations per ingress token
- `Service-Worker-Allowed: /` header set in middleware
- PWA requires HTTPS — graceful degradation on HTTP (no SW registration, no install prompt)
