# Frontier Expert Panel — Phase 25 Iteration 05

## Objective

Fresh audit focused on DRY violations, export hardening, and HA connection semantics.

| Persona | Recommendation | Impact | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Platform Architect | task-sync-service.ts has 3 identical patterns mapping persisted response to CreateTaskAndSyncResult (L46-57, L118-128, L149-159). Extract a shared helper function buildResult() to eliminate DRY violation. | 3 | 1 | 1 | ✅ Accept |
| OSS Integrations Specialist | export/tasks.json.ts L10 uses SELECT * which couples to the DB schema. Replace with explicit column list matching the tasks table schema. | 3 | 1 | 1 | ✅ Accept |
| Reliability Engineer | ha/connection.ts returns 200 for connection failures (L56, L91). While this is technically a "health check" response, add a Cache-Control: no-store header to prevent browsers from caching stale connection status. | 2 | 1 | 1 | ✅ Accept |
| Security Engineer | export/tasks.json.ts downloads the entire database contents. While protected behind ingress, add a Content-Security-Policy header to prevent the downloaded file from being opened as HTML. | 2 | 1 | 1 | ✅ Accept |
| Product Architect | The export filename uses ISO date format which is correct and consistent. No change needed. | 0 | 0 | 0 | Already correct |
