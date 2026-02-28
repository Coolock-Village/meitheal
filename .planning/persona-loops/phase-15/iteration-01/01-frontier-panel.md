# Frontier Expert Panel — Phase 15 Iteration 01

## Objective
Validate board-domain separation and Trello/Jira parity scope before implementation starts.

| Persona | Recommendation | Impact | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| DDD Architect | Move board-selection logic from page scripts into a typed board domain module with explicit API boundaries. | 4 | 2 | 3 | Accept |
| Accessibility Engineer | Add keyboard-first alternatives for Kanban movement (no mouse-only drag dependency). | 5 | 3 | 4 | Accept |
| API Architect | Add stronger validation and error contracts on `/api/boards` (length, color format, icon whitelist). | 4 | 2 | 3 | Accept |
| UX Systems Lead | Keep task-detail deep-link behavior consistent across list/kanban/table using one canonical hash parser. | 4 | 2 | 2 | Accept |
| Performance Engineer | Remove full page reload on Kanban status move; patch local DOM/state and sync in background. | 3 | 2 | 2 | Accept |
| HA Runtime Engineer | Preserve low memory profile; no new heavy client dependencies for phase-15 UX upgrades. | 3 | 1 | 3 | Accept |
