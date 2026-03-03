# Panel 1: Frontier Experts — Phase 57b Iteration 02

## Platform Architect
**Recommendation:** The CSS `url()` rewriting happens in TWO places — a Vite `generateBundle` plugin (build-time) and a middleware runtime rewriter (line 66-76). The middleware CSS rewriter is now dead code since the Vite plugin handles it at build time. Remove it to reduce runtime overhead and eliminate confusion.
- Impact: 3 | Effort: 1 | Risk: 2
- Success: No CSS rewrite code in middleware.ts; font URLs still resolve in HA ingress.
- **Decision: Accept**

## OSS Integrations Specialist
**Recommendation:** The `@fontsource` packages ship ALL unicode ranges (Cyrillic, Greek, Vietnamese, etc.) but Meitheal is English/Irish only. Use `@fontsource-variable/inter/latin.css` and equivalent subset imports to reduce CSS bundle by ~60%.
- Impact: 3 | Effort: 1 | Risk: 1
- Success: CSS bundle drops from ~17KB to ~5KB for font declarations.
- **Decision: Accept**

## Reliability Engineer
**Recommendation:** The `manifest.webmanifest` stream error (`Cannot write to closing transport`) in Supervisor logs indicates the manifest response is too slow or the connection drops. Add `Cache-Control: public, max-age=86400` to the manifest route to reduce re-fetch frequency.
- Impact: 3 | Effort: 1 | Risk: 1
- Success: No more `Stream error` for manifest in Supervisor logs after deploy.
- **Decision: Accept**

## Security Engineer
**Recommendation:** The middleware `url` object (`new URL(request.url)`) is now constructed before rate limiting. If a malformed URL is sent, this would throw and crash the middleware. Wrap in try/catch or validate early.
- Impact: 2 | Effort: 1 | Risk: 2
- Success: Malformed URLs return 400 instead of crashing.
- **Decision: Reject** — `new URL(request.url)` uses the already-parsed request URL from Astro; it cannot fail since the framework already validated it.

## Product Architect
**Recommendation:** The Integrations page mode tab labels "HA Addon (auto)" and "Standalone" are confusing for users who don't understand the HA addon architecture. Rename to "Automatic (HA)" and "Manual Setup" for clearer UX language.
- Impact: 2 | Effort: 1 | Risk: 1
- Success: User comprehension improves; labels match the domain language in docs.
- **Decision: Defer** — minor UX polish, not blocking production. Address in next Settings audit.
