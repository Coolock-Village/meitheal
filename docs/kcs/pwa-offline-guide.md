# PWA & Offline-First Guide

## How Offline Mode Works

Meitheal uses a **service worker** to cache the app shell and intercept network requests. When you lose connectivity:

1. **Static assets** (CSS, JS, fonts) — served from cache instantly
2. **API routes** — attempted via network, falls back to cached response or offline error
3. **Navigation** — cached pages load normally, unknown routes show the offline fallback page
4. **Task operations** — saved to IndexedDB immediately, queued for sync when online

## What's Available Offline

| Feature | Offline | Notes |
|---------|---------|-------|
| View tasks | ✅ | Last-synced data from IndexedDB |
| Create tasks | ✅ | Saved locally, synced when online |
| Edit tasks | ✅ | Saved locally, synced when online |
| Delete tasks | ✅ | Marked for deletion, synced when online |
| Image attachments | ✅ | Stored as Base64 in IDB `task_attachments` store |
| Notifications | ✅ | Overdue alerts work offline (fired from client) |
| Cross-tab sync | ✅ | BroadcastChannel works entirely client-side |
| Calendar sync | ❌ | Requires network (HA API call) |
| Webhook delivery | ❌ | Requires network |

## Web API Integrations

Meitheal leverages modern browser APIs for a native-like experience:

| API | Module | Purpose |
|-----|--------|---------|
| Notifications + Permissions | `domains/offline/notifications.ts` | Task reminders, overdue alerts |
| Web Locks | `domains/offline/sync-lock.ts` | Single-tab sync queue safety |
| BroadcastChannel | `domains/offline/tab-sync.ts` | Cross-tab state sync |
| Web Share | `lib/web-share.ts` | Native OS share dialog |
| Clipboard | `lib/clipboard.ts` | Copy task URL/markdown |
| Vibration | `lib/haptics.ts` | Tactile feedback on mobile |
| IntersectionObserver | `lib/lazy-load.ts` | Deferred rendering |
| Screen Wake Lock | `lib/wake-lock.ts` | Keep screen on in focus mode |
| PerformanceObserver | `lib/perf-observer.ts` | Web Vitals (LCP/FID/CLS) |
| prefers-color-scheme | `lib/theme-watcher.ts` | OS dark/light detection |
| ResizeObserver | `lib/responsive-observer.ts` | Adaptive sidebar collapse |
| Badging | `Layout.astro` | Pending task count on app icon |
| Page Visibility | `sync-engine.ts` | Throttle sync when tab hidden |
| StorageManager | `offline-store.ts` | Quota monitoring |

All APIs use **feature detection** with graceful fallbacks — unsupported browsers get silent no-ops.

## Manifest Features

The web app manifest (`manifest.webmanifest`) includes:

- **Shortcuts**: New Task, Kanban Board, Settings — appear in long-press/right-click on app icon
- **Share Target**: Receive shared content from other apps (text → new task)

## Sync Status Indicator

| Icon | State | Meaning |
|------|-------|------------|
| ✓ | Synced | All changes saved to server |
| ↻ | Syncing | Upload in progress |
| ● | Pending | Changes queued, waiting for connectivity |
| ⊘ | Offline | No network connection |

## Conflict Resolution

When the same task is edited on multiple devices:

- **Last write wins** — the most recent `updatedAt` timestamp takes precedence
- The server's timestamp is authoritative (prevents clock skew issues)
- Conflicts are logged as `sync.conflict.resolved` domain events
- No data is lost — overwritten changes are preserved in the event log

## Storage Limits

- **Sync queue**: max 100 pending operations (warning at capacity)
- **IndexedDB tasks**: warning at 50MB, guidance at 100MB
- **IndexedDB attachments**: large images are Base64-encoded (~1.37x file size); monitor total IDB usage
- **Precache**: ≤ 1MB budget for static assets
- **StorageManager**: quota monitoring logs warnings when usage exceeds 80%

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App shows stale data | Pull down to refresh, or check sync indicator |
| "Queue at capacity" | Connect to network to flush pending changes |
| SW update available | Accept update prompt when it appears |
| Clearing all offline data | Browser settings → Clear site data |
| Force sync | Navigate to any page while online |
| Attachment not showing | Check browser IDB storage quota in DevTools |
| Notification not showing | Check notification permissions in browser settings |
| Theme not matching OS | Clear `meitheal-theme` from localStorage |

## Home Assistant Ingress Compatibility

When Meitheal runs as an HA add-on, all URLs are proxied through `/api/hassio_ingress/{token}/`. PWA scope validation, service worker registration, and manifest resolution all depend on stable URLs — and this works because:

1. **Ingress token is permanent** — per-installation, survives restarts and addon updates (confirmed HA issue #6605)
2. **`Service-Worker-Allowed: /`** — set by middleware, allows SW to claim scope broader than its script path
3. **`X-Ingress-Path`** — available server-side as request header from Supervisor, echoed as response header by middleware
4. **Dynamic manifest** — `/manifest.webmanifest` is an API route that prefixes `scope`, `start_url`, and icon/shortcut URLs with the ingress path
5. **SW registration** — uses `window.__ingress_path` to construct `{ingressPath}/sw.js` URL and `{ingressPath}/` scope
6. **SW precache** — receives `SET_INGRESS_PATH` message and prefixes all precache URLs accordingly

**No ingress = standalone mode**: all paths stay at `/` (backward compatible).

| Feature | Standalone | HA Ingress |
|---------|-----------|------------|
| SW URL | `/sw.js` | `/api/hassio_ingress/{token}/sw.js` |
| SW Scope | `/` | `/api/hassio_ingress/{token}/` |
| Manifest scope | `/` | `/api/hassio_ingress/{token}/` |
| Install prompt | ✅ | ✅ (HTTPS required) |
| Offline caching | ✅ | ✅ (HTTPS required) |

## HTTPS Requirement

PWA features (service worker, install prompt, push notifications) require a **secure context** — HTTPS or localhost.

| Access Method | HTTPS | PWA Available |
|---------------|-------|---------------|
| Nabu Casa | ✅ auto | ✅ |
| DuckDNS + Let's Encrypt | ✅ addon | ✅ |
| Reverse proxy (Caddy, NPM) | ✅ | ✅ |
| Direct LAN HTTP | ❌ | ❌ |
| localhost | ✅ implicit | ✅ |

**Graceful degradation**: on insecure origins, Meitheal skips SW registration silently. The app works fully — you just won't get offline caching or the install prompt. Settings > General shows a PWA status card with actionable HTTPS guidance.

---

*Last updated: 2026-03-03 — PWA HTTPS graceful degradation*

