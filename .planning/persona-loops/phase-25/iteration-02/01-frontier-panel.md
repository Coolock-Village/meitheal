# Frontier Expert Panel — Phase 25 Iteration 02

## Objective

Fresh independent audit of the Meitheal codebase focusing on API correctness, sync engine logic, and runtime safety.

| Persona | Recommendation | Impact | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Platform Architect | `sync-engine.ts` line 108-109: after a 409 conflict, the code calls `removeSyncOp(op.id)` then `incrementRetryCount(op.id)`. The increment is dead code because the op was already removed. Remove the dead `incrementRetryCount` call. | 3 | 1 | 1 | ✅ Accept |
| OSS Integrations Specialist | `api/tasks/[id].ts` DELETE returns 200 with `{deleted: true}`. REST convention is 204 No Content. Change to `return new Response(null, { status: 204 })`. | 2 | 1 | 1 | ✅ Accept |
| Reliability Engineer | `sync-engine.ts` line 101: `JSON.parse(op.payload).updatedAt as string` — this cast is unsafe. If `updatedAt` is missing from the payload, the conflict event emits `undefined` as the localUpdatedAt field. Add a default. | 3 | 1 | 1 | ✅ Accept |
| Security Engineer | `api/tasks/[id].ts` PUT builds SQL dynamically with `col = ?` from user-controlled field names. While the code filters through a sanitized object, the column names come from hardcoded keys, which is safe. No action. | 0 | 0 | 0 | Already correct |
| Product Architect | `kanban.astro` at 1769 lines is the largest file in the codebase. Extract the drag-and-drop sort logic into a separate `kanban-dnd.ts` module to reduce cognitive load. | 3 | 3 | 2 | Defer — effort = impact |
