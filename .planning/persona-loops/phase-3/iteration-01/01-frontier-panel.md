# Frontier Panel — Phase 3 Iteration 01

## Panel Members

| Persona | Domain | Focus |
|---------|--------|-------|
| PWA Architect | Service workers, Web APIs | Cache strategy, offline resilience, update lifecycle |
| IndexedDB Specialist | Client storage, offline-first | Schema design, transaction safety, quota management |
| Performance Engineer | Lighthouse, Core Web Vitals | Precache budget, runtime performance, HA Green constraints |
| Accessibility Engineer | WCAG 2.1, screen readers | Offline state announcements, install prompt UX |

## Recommendations

| ID | Persona | Recommendation | Impact | Effort | Risk | Score |
|----|---------|----------------|--------|--------|------|-------|
| FR-301 | PWA Architect | Use `@vite-pwa/astro` integration instead of manual Workbox — it handles precache manifest, registration, and update lifecycle automatically within Astro build. | 5 | 1 | 2 | 8 |
| FR-302 | PWA Architect | Service worker must include a `navigationPreload` handler — without it, navigation requests stall on slow networks while SW boots. | 4 | 2 | 4 | 10 |
| FR-303 | IndexedDB Specialist | Use versioned IndexedDB schema (`version: 1`) with explicit upgrade handler — enables future schema migrations without data loss. | 5 | 1 | 3 | 9 |
| FR-304 | IndexedDB Specialist | IndexedDB writes should use `readwrite` transactions with explicit error handling — silent failures corrupt sync queue. | 4 | 1 | 4 | 9 |
| FR-305 | Performance Engineer | Precache only the app shell HTML + critical CSS/JS — don't precache route pages. Route pages use stale-while-revalidate. | 4 | 1 | 2 | 7 |
| FR-306 | Performance Engineer | Add `sizes` field to manifest icons for proper icon selection on Android/iOS. Missing sizes causes install failures on some devices. | 3 | 1 | 3 | 7 |
| FR-307 | Accessibility Engineer | Sync status `aria-live="polite"` region must announce state changes with meaningful text ("3 changes pending sync") not just icon changes. | 4 | 1 | 2 | 7 |
| FR-308 | PWA Architect | Service worker skipWaiting should require user confirmation — auto-skipWaiting can cause page inconsistencies if old and new cache schemas differ. | 4 | 2 | 4 | 10 |
