# Frontier Panel - Phase 1 Iteration 01

## Objective
Gamification + Labels Gap Analysis and Sprint Planning

| Persona | Recommendation | Impact (1-5) | Effort (1-5) | Risk (1-5) | Decision |
| --- | --- | --- | --- | --- | --- |
| Platform Architect | Unify the dual label storage (native JSON strings in `tasks.labels` vs relational `vikunja_labels` + `task_labels`) behind a single `LabelRepository` before extracting UI components — prevents building components on an inconsistent data model | 4 | 4 | 3 | Defer |
| OSS Integrations Specialist | Use CSS-only confetti (no external lib like `canvas-confetti`) to stay Astro-native/first and avoid runtime JS bundle bloat — `@keyframes` particle animation with `prefers-reduced-motion` guard | 4 | 2 | 1 | Accept |
| Reliability Engineer | Add E2E tests for label CRUD API endpoints (`PUT /api/labels/:id`, `DELETE /api/labels/:id`) before building the Settings management UI — ensures API contract is validated before UI consumes it | 5 | 2 | 1 | Accept |
| Security Engineer | Sanitize label titles via `stripHtml()` on both create and rename paths, and validate `hex_color` format strictly (`/^#[0-9a-fA-F]{6}$/`) — existing create path does this, rename endpoint must match | 4 | 1 | 2 | Accept |
| Product Architect | Define labels as a proper DDD bounded context (`domains/labels/`) with a `LabelStore` service layer instead of scattering label logic across `vikunja-compat/store.ts`, `api/labels.ts`, and inline page scripts — establishes ubiquitous language for the label domain | 4 | 3 | 2 | Accept |

## Rejected or Deferred

- **Platform Architect** (Deferred): Dual storage unification has `impact >= 4` but `effort >= 4`. Trigger: after Phase 3 Label Management is complete and the inconsistency becomes a maintenance burden.
