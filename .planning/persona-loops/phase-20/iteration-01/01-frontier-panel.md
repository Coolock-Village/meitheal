# Frontier Panel - Phase 20 Iteration 01

## Objective

Agile Board Epic/Story/Task Hierarchy implementation

| Persona | Recommendation | Impact (1-5) | Effort (1-5) | Risk (1-5) | Decision |
| --- | --- | --- | --- | --- | --- |
| Platform Architect | Update Kanban drag-and-drop to adjust `parent_id` when dragging into an Epic or Story swimlane | 5 | 3 | 2 | Accept |
| OSS Integrations Specialist | Map `epic` and `story` to Vikunja labels or projects to prevent data loss on sync | 3 | 4 | 2 | Defer |
| Reliability Engineer | Gracefully fallback for unknown or malformed `task_type` values in JS filter logic | 4 | 1 | 1 | Accept |
| Security Engineer | Audit `/api/boards` endpoint creation limits and pagination constraints | 4 | 2 | 4 | Accept |
| Product Architect | Show the parent Epic or Story as a clickable breadcrumb in the task detail panel | 5 | 3 | 2 | Accept |

## Rejected or Deferred

- OSS Integrations Specialist map to Vikunja: deferred due to high effort for edge case.
