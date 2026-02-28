# Frontier Expert Panel — Phase 7 Iteration 01

## Objective
Audit Phase 6 UI for code quality, accessibility, performance, security, and UX gaps.

| Persona | Recommendation | Impact | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Platform Architect | Remove unused `statusLabels` const in `table.astro` (line 34) — causes TS hint and dead code in bundle. Also remove duplicate `create.ts` API route that overlaps with `index.ts POST`. | 4 | 1 | 1 | Accept |
| OSS Integrations Specialist | Add `aria-label` attributes to all interactive elements (sidebar nav, buttons, modals, form inputs) for screen reader accessibility. Currently missing on view-switcher buttons, nav badges, and modal overlays. | 4 | 2 | 1 | Accept |
| Reliability Engineer | Add loading states to all async operations (task create/edit/delete/checkbox toggle) — currently buttons don't show any loading indicator during API calls, which leads to double-submissions. | 5 | 2 | 1 | Accept |
| Security Engineer | Add CORS headers to API routes and rate limiting comment/documentation for future implementation. Sanitize description field with HTML tag stripping same as title (currently only has length limit). | 3 | 2 | 1 | Accept |
| Product Architect | Implement settings persistence via a `settings` table in SQLite — framework selector (RICE/DRICE/HEART/KCS/DDD) needs to be configurable with enable/disable toggles per framework, not just a dropdown. User explicitly requested this. | 5 | 3 | 1 | Accept |
