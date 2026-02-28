# Frontier Expert Panel — Phase 6 Iteration 01

## Objective
Review Phase 6 UI implementation for feature parity, architecture quality, and gap matrix coverage.

| Persona | Recommendation | Impact (1-5) | Effort (1-5) | Risk (1-5) | Decision |
| --- | --- | --- | --- | --- | --- |
| Platform Architect | Extract shared task types (PersistedTask, TaskView, Priority) into a `@meitheal/domain-tasks` barrel export so all pages and API routes import from one source instead of duplicating type definitions and priority/status maps inline. | 5 | 2 | 1 | Accept |
| OSS Integrations Specialist | Add `/api/v1/tasks` Vikunja-compatible list endpoint that maps Meitheal task fields to Vikunja's schema (id, title, done, priority, due_date, labels) — this is required by gap matrix API compatibility row. | 5 | 3 | 2 | Accept |
| Reliability Engineer | Add error boundary handling in all Astro pages — currently a DB connection failure during SSR render will crash the page with a 500. Wrap all `ensureSchema()` + query blocks in try/catch with graceful empty-state fallback. | 5 | 2 | 1 | Accept |
| Security Engineer | Sanitize all user input in task creation/update API routes — currently title/description are stored raw. Add XSS prevention by escaping HTML in title before rendering, and validate priority is 1-5, status is an allowed enum value. | 5 | 2 | 2 | Accept |
| Product Architect | Make the PM framework scoring configurable with enable/disable toggles and editable field definitions stored in a `settings` table, not hardcoded in the settings page UI — currently the RICE/DRICE/HEART/KCS options are just a select dropdown with no persistence. | 5 | 3 | 2 | Accept |
