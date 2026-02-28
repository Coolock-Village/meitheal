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
| Calendar sync | ❌ | Requires network (HA API call) |
| Webhook delivery | ❌ | Requires network |

## Sync Status Indicator

| Icon | State | Meaning |
|------|-------|---------|
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

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App shows stale data | Pull down to refresh, or check sync indicator |
| "Queue at capacity" | Connect to network to flush pending changes |
| SW update available | Accept update prompt when it appears |
| Clearing all offline data | Browser settings → Clear site data |
| Force sync | Navigate to any page while online |
| Attachment not showing | Check browser IDB storage quota in DevTools |

---

*Last updated: 2026-02-28 — Phase 23 Offline Image Attachments*
