# Frontier Expert Panel — Phase 25 Production Polish

## Objective

Audit the full Meitheal codebase for production readiness, covering architecture, security, reliability, integrations, and UX coherence after 16 completed phases.

| Persona | Recommendation | Impact | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Platform Architect | Add `apple-touch-icon` and `theme-color` meta tags to `Layout.astro` for full PWA manifest compliance. Currently missing from the `<head>`, which fails Lighthouse PWA checks on iOS/Safari. | 4 | 1 | 1 | ✅ Accept |
| OSS Integrations Specialist | Replace manual `IDBDatabase` promise wrappers in `offline-store.ts` with the `idb` library's `openDB()` helper. The `idb` package is already declared as a dependency but unused — the store still uses raw `indexedDB.open()`. | 3 | 3 | 2 | Defer — effort = impact, low priority |
| Reliability Engineer | Add `Content-Security-Policy` header to the middleware to prevent XSS via inline script injection. Currently no CSP header is set, leaving the app vulnerable to reflected XSS. | 5 | 2 | 3 | ✅ Accept |
| Security Engineer | The `strip-html.ts` utility uses regex-based HTML stripping. Replace with DOMParser-based sanitization (`new DOMParser().parseFromString(input, 'text/html').body.textContent`) which is more robust against malformed HTML. | 4 | 1 | 1 | ✅ Accept |
| Product Architect | Add `<meta name="description">` tag to all page layouts with contextual content (dashboard, kanban, tasks, settings). Currently only the title tag is set, missing SEO and social sharing metadata. | 3 | 1 | 1 | ✅ Accept |
