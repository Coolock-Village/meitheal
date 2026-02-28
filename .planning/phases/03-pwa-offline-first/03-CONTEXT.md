# Phase 3: PWA & Offline-First — Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers **progressive web app infrastructure and offline-first data layer**. Users can install Meitheal as a PWA, create/edit tasks offline, and have changes sync automatically when connectivity returns. This establishes the foundation for mobile parity (gap-matrix item #5) and local-first execution (gap-matrix item #4).

This phase does NOT add new task types, new integrations, or authentication changes. It wraps the existing Astro SSR app in a service worker shell and adds an IndexedDB data layer with background sync.

</domain>

<decisions>
## Implementation Decisions

### Service Worker Strategy
- Workbox-based service worker (Astro PWA integration via `@vite-pwa/astro`)
- Cache-first for static assets (CSS, JS, fonts, images)
- Network-first for API routes (`/api/*`) with offline fallback queue
- App shell pattern: cache the layout/shell, dynamic content via API
- Precache manifest generated at build time
- Update strategy: prompt user on new version available (skipWaiting on confirm)

### Offline Data Layer
- IndexedDB via `idb` library (lightweight, promise-based wrapper)
- Mirror key Drizzle schema tables in IndexedDB: tasks, framework_scores
- Read path: IndexedDB first, network for freshness check
- Write path: write to IndexedDB immediately, enqueue for background sync
- Queue stored in IndexedDB: `pending_sync` table with operation type, payload, timestamp
- Max queue depth: 100 operations before warning user

### Background Sync
- Background Sync API (`SyncManager`) for reliable delivery
- Fallback: periodic sync via `setInterval` when Background Sync unavailable
- Sync strategy: FIFO queue, one-at-a-time to preserve ordering
- Conflict detection: compare `updated_at` timestamps
- On conflict: last-write-wins with audit trail (conflict logged as domain event)
- Sync status indicator in UI: synced ✓ / syncing ↻ / pending ● / offline ⊘

### Conflict Resolution
- Deterministic: last-write-wins based on `updated_at` timestamp
- Client clock skew mitigation: server timestamp is authoritative
- Conflict events emitted as `sync.conflict.resolved` domain events
- Conflicts logged to observability pipeline (Phase 2 webhook infrastructure)
- No manual merge UI in Phase 3 — deferred to Phase 5

### Install Experience
- Web app manifest (`manifest.webmanifest`) with Meitheal branding
- Install prompt: deferred until 2nd visit (avoid first-visit banner fatigue)
- Icons: 192px and 512px PNG (generated from logo)
- Theme color: matches Meitheal brand palette
- Standalone display mode (no browser chrome)

### Performance Constraints
- HA Green target: 2GB RAM, 128MB Node heap (from PROJECT.md)
- Service worker must not exceed 1MB precache budget
- IndexedDB storage: warn at 50MB, hard limit at 100MB
- Offline queue capped at 100 pending operations
- No heavy crypto or WASM in service worker (HA Green CPU constraint)

### Claude's Discretion
- Workbox plugin selection and caching strategy details
- IndexedDB schema naming conventions
- Sync indicator UI component styling
- Install prompt timing mechanism

</decisions>

<specifics>
## Specific Ideas

- Service worker should gracefully degrade — app must work identically without it (SSR fallback)
- Offline indicator should be a small persistent badge, not a modal/banner
- Sync queue should survive PWA updates (IndexedDB persists across SW versions)
- All offline operations should feel instant — no loading spinners for local writes
- Gap-matrix: this phase directly addresses "Local-first/offline execution" (Meitheal target: Strong) and "Mobile/offline/collab parity" (Meitheal target: Strong)

</specifics>

<deferred>
## Deferred Ideas

- Push notifications — requires VAPID keys and notification permission UX (Phase 5)
- Manual conflict merge UI — complex UX, defer to Phase 5 market parity
- Multi-tab sync coordination — defer, single-tab is sufficient for Phase 3
- File attachment offline caching — storage budget concern, defer
- Shared workers for multi-tab data coordination — complexity, defer

</deferred>

---

*Phase: 03-pwa-offline-first*
*Context gathered: 2026-02-28*
