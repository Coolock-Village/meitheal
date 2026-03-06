# 50-Persona Audit — Phase 32: Task Items UX Fixes

**Scope:** All code changes from Phase 32 (checkboxes, selects, activity log, strategic lens, task links, settings cache, XSS hardening, type badges, option dedup, DELETE query param).

---

## Category 1: UX Design (5 personas)

### 1. Interaction Designer
**Finding:** The link search debounce is 300ms but there's no visual indicator that a search is in progress. Users typing fast see nothing happen until results appear.
**Action:** Add a spinner/pulsing indicator to the search results container while fetching.
- I:3 | E:1 | R:1

### 2. Information Architect
**Finding:** The Related Links section lacks a count badge showing how many links exist before expanding/scrolling.
**Action:** Add `(N)` count after the "Related Links" heading.
- I:2 | E:1 | R:1

### 3. Microinteraction Designer
**Finding:** When a link is created or removed, there's no transition — the list snaps. Add a subtle fade-in/out animation.
**Action:** Add CSS transition on link row insert/remove.
- I:2 | E:1 | R:1

### 4. Form UX Specialist
**Finding:** The custom field select dropdown doesn't show the current selected value when re-opening the task detail (the value loads into the `<select>` correctly but there's no visual highlight on the selected option).
**Action:** Already working via `selected` attribute. No action needed.
- Verified ✅

### 5. Empty State Designer
**Finding:** When a task has zero related links, the container is empty with no guidance. Users need to know the feature exists.
**Action:** Add placeholder text: "No related links. Use the search above to link tasks."
- I:2 | E:1 | R:1

---

## Category 2: Data Integrity (5 personas)

### 6. Schema Consistency Analyst
**Finding:** `task_links.created_at` stores epoch ms (INTEGER) while `tasks.created_at` stores ISO string (TEXT). Inconsistent timestamp format.
**Action:** Use ISO string for consistency. Update CREATE TABLE and INSERT to use `new Date().toISOString()`.
- I:3 | E:2 | R:2

### 7. Referential Integrity Auditor
**Finding:** `task_links` has no FOREIGN KEY constraints on `source_task_id` and `target_task_id`. Deleting a task leaves orphan link rows.
**Action:** Add `ON DELETE CASCADE` foreign key constraints, or add a cleanup step when deleting tasks.
- I:4 | E:2 | R:2

### 8. Idempotency Reviewer
**Finding:** POST `/api/tasks/[id]/links` uses `INSERT OR IGNORE`, so duplicate links silently succeed without telling the client. The 201 response implies creation even when ignored.
**Action:** Check if link exists first and return 200 (existing) vs 201 (created), or return `{ created: false }`.
- I:3 | E:2 | R:1

### 9. Data Migration Specialist
**Finding:** The `task_links` table has no migration version tracking. If the schema changes, there's no rollback path.
**Action:** Add a schema_version check in `ensureSchema()`. (Deferred from iteration 01.)
- I:3 | E:3 | R:2

### 10. Serialization Auditor
**Finding:** `getCFFromUI()` serializes custom field values to JSON but doesn't preserve field types. When re-loaded, a checkbox value "true" becomes a text value unless the settings field lookup is done.
**Action:** Already handled by `addCFRow` type lookup. Verified ✅

---

## Category 3: UI Engineering (5 personas)

### 11. CSS Architecture Reviewer
**Finding:** Link row styling uses inline `style=""` attributes extensively. Should use utility classes or a CSS class for consistency.
**Action:** Replace inline styles with CSS classes in the `createLinkRow` helper.
- I:2 | E:2 | R:1

### 12. Component Reuse Analyst
**Finding:** Parent search and link search are duplicate implementations (~50 lines each). Extract `TaskSearchDropdown` utility.
**Action:** Create shared `initTaskSearchDropdown(input, results, onSelect)` function.
- I:4 | E:3 | R:2

### 13. Responsive Design Reviewer
**Finding:** The Related Links section has `min-width:90px` on the label span, which may overflow on narrow mobile/sidebar views.
**Action:** Add responsive breakpoint or use `flex-shrink:0` with a max-width fallback.
- I:2 | E:1 | R:1

### 14. Theme Consistency Auditor
**Finding:** Remove button uses `color:var(--danger)` inline. The link type select has no custom styling. Both should use theme tokens.
**Action:** Add `.td-link-remove-btn` class with theme-aware styling.
- I:2 | E:1 | R:1

### 15. Animation Performance Reviewer
**Finding:** No animation concerns found. createLinkRow uses lightweight DOM operations. Verified ✅

---

## Category 4: Architecture (5 personas)

### 16. Module Boundary Reviewer
**Finding:** `addCFRow` is a 70-line function handling 6 field types with innerHTML. It should be a `CustomFieldRenderer` factory.
**Action:** Extract `createCustomFieldElement(key, value, type, options)` that returns a DOM element.
- I:3 | E:3 | R:3

### 17. API Contract Reviewer
**Finding:** GET `/api/tasks/[id]/links` returns `{ outbound, inbound }` — but the column names differ between outbound (target_title) and inbound (source_title). Client has to handle both shapes differently.
**Action:** Normalize the response shape to `{ links: [] }` with consistent `linked_task_id, linked_title, direction` fields.
- I:3 | E:3 | R:2

### 18. Error Boundary Analyst
**Finding:** `loadRelatedLinks` silently catches fetch errors. The user sees an empty container with no feedback when the API fails.
**Action:** Show an error state: "Failed to load links. Tap to retry."
- I:3 | E:1 | R:1

### 19. Dependency Direction Reviewer
**Finding:** `StrategicEvaluator.astro` now depends on the settings API contract (framework_mapping key). This creates a hidden coupling. The cached settings approach (iteration 01) reduces this to a pass-through.
**Action:** Already mitigated by cached settings pattern. Verified ✅

### 20. State Management Reviewer
**Finding:** `currentTaskId` is a module-level variable shared between `loadRelatedLinks`, `createLink`, and event handlers. If two task details are opened rapidly, a race condition could link to the wrong task.
**Action:** Capture `taskId` in closure at call time rather than relying on module-level `currentTaskId`.
- I:4 | E:2 | R:2

---

## Category 5: Security (5 personas)

### 21. Input Validation Specialist
**Finding:** `link_type` is validated server-side but `target_task_id` is not validated as a valid UUID format. A malformed ID could cause SQL errors.
**Action:** Add UUID format validation for `target_task_id`.
- I:3 | E:1 | R:1

### 22. Authorization Auditor
**Finding:** DELETE endpoint doesn't verify that `link_id` belongs to the task specified in `params.id`. Any user could delete any link by guessing the link ID without knowing the task ID.
**Action:** Add `WHERE id = ? AND (source_task_id = ? OR target_task_id = ?)` check.
- I:4 | E:1 | R:1

### 23. CSRF Prevention Reviewer
**Finding:** POST/DELETE endpoints lack CSRF protection. In HA ingress context, CORS provides some protection, but a dedicated auth token would be better.
**Action:** Low risk in HA ingress context — CORS + same-origin. Note for future API gateway.
- I:2 | E:3 | R:1

### 24. Error Disclosure Reviewer
**Finding:** API error responses include raw error messages: `${err}`. This could leak internal details.
**Action:** Log full error server-side, return generic message to client.
- I:3 | E:1 | R:1

### 25. Rate Limiting Reviewer
**Finding:** No rate limiting on link creation. A malicious client could create thousands of links.
**Action:** Low priority in HA addon context. Note for future API gateway.
- I:1 | E:3 | R:1

---

## Category 6: Accessibility (5 personas)

### 26. Screen Reader Auditor
**Finding:** Link remove buttons have no accessible label — only `×` text. Screen readers announce "times" or nothing.
**Action:** Add `aria-label="Remove link to {task title}"`.
- I:3 | E:1 | R:1

### 27. Keyboard Navigation Tester
**Finding:** Link search results are not keyboard-navigable. Users must click results; arrow keys don't work in the dropdown.
**Action:** Add `role="listbox"`, `role="option"`, and arrow key navigation to link search results.
- I:3 | E:2 | R:1

### 28. Color Contrast Auditor
**Finding:** The link type label uses `text-text-muted` which may have insufficient contrast on light backgrounds.
**Action:** Verify WCAG AA compliance for muted text. If insufficient, use `text-text-secondary`.
- I:2 | E:1 | R:1

### 29. Focus Management Specialist
**Finding:** After creating a link, focus doesn't return to the search input. Users must re-click.
**Action:** After successful link creation, clear and re-focus the search input.
- I:2 | E:1 | R:1

### 30. ARIA Live Region Specialist
**Finding:** Link creation/deletion has no screen reader announcement.
**Action:** Add `aria-live="polite"` region that announces "Link created" / "Link removed".
- I:2 | E:1 | R:1

---

## Category 7: Performance (5 personas)

### 31. Network Waterfall Analyst
**Finding:** `loadRelatedLinks` fires a separate GET request for links in addition to the task detail fetch and settings fetch. Could be batched.
**Action:** Include links in the task detail API response (`/api/tasks/[id]` returns `{ task, links }`).
- I:3 | E:3 | R:2

### 32. DOM Mutation Auditor
**Finding:** The `renderFieldDropdown` rebuilds the entire dropdown innerHTML on every keystroke filter. For large field lists, this could be slow.
**Action:** Use `display:none/block` toggling instead of innerHTML rebuild.
- I:2 | E:2 | R:1

### 33. Memory Leak Hunter
**Finding:** Event listeners added in `createLinkRow` and search results are properly cleaned up when `container.innerHTML = ""` removes DOM nodes. No leak found.
- Verified ✅

### 34. Bundle Size Analyst
**Finding:** Layout.astro script is 269 KB (91 KB gzipped). The largest chunk. Task detail logic should be a separate lazy-loaded module.
**Action:** Consider code-splitting in future refactor phase. Functional but heavy.
- I:3 | E:4 | R:3

### 35. SQL Query Optimizer
**Finding:** `loadRelatedLinks` executes two SQL queries (outbound + inbound). Could be a single UNION query.
**Action:** Combine with UNION ALL for single query execution.
- I:2 | E:2 | R:1

---

## Category 8: HA Integration (5 personas)

### 36. Ingress Proxy Specialist
**Finding:** DELETE now uses query params (proxy-safe). POST uses JSON body — verify HA ingress forwards POST body correctly.
**Action:** Already verified — HA ingress passes POST bodies. Verified ✅

### 37. WebSocket Event Emitter
**Finding:** Task link creation/deletion doesn't emit HA events. Node-RED/n8n automations can't react to link changes.
**Action:** Emit `meitheal_task_link_created` / `meitheal_task_link_deleted` events.
- I:3 | E:2 | R:1

### 38. Addon Lifecycle Reviewer
**Finding:** `task_links` table creation in `ensureSchema` is robust. Addon restart re-creates if needed. Verified ✅

### 39. HA State Entity Reviewer
**Finding:** Task links aren't reflected in HA sensor entities. The task count sensor could include link counts.
**Action:** Add `total_links` to the stats sensor payload.
- I:2 | E:1 | R:1

### 40. Multi-Instance Reviewer
**Finding:** If multiple browser tabs are open, creating a link in one tab doesn't refresh links in another. No WebSocket push for link changes.
**Action:** Add link changes to the existing WebSocket sync mechanism.
- I:3 | E:3 | R:2

---

## Category 9: DDD / Domain (5 personas)

### 41. Bounded Context Reviewer
**Finding:** `task_links` is conceptually part of the "Tasks" domain but the `links.ts` API file sits at `pages/api/tasks/[id]/links.ts`. It should have a corresponding domain service in `domains/tasks/`.
**Action:** Create `domains/tasks/services/link-service.ts` with business logic extracted from the API route.
- I:3 | E:3 | R:2

### 42. Ubiquitous Language Auditor
**Finding:** The code uses "link" in some places and "relationship" in others. Standardize on "link" everywhere.
**Action:** Verify all comments, variables, and UI labels use "link" consistently.
- I:2 | E:1 | R:1

### 43. Aggregate Root Reviewer
**Finding:** Tasks are the aggregate root. Links should be loaded/saved as part of the task aggregate, not as a separate API call.
**Action:** See Performance #31 — include links in task detail response. (Deferred to future refactor.)
- I:3 | E:3 | R:2

### 44. Domain Event Specialist
**Finding:** Link creation/deletion should trigger domain events for downstream handlers (activity log, notifications, automations).
**Action:** Add activity log entry when links are created/deleted.
- I:3 | E:2 | R:1

### 45. Value Object Auditor
**Finding:** `LinkType` is defined as a union type in the API file. Should be exported and shared across the codebase.
**Action:** Move to `domains/tasks/types.ts` for reuse.
- I:2 | E:1 | R:1

---

## Category 10: DevOps / Quality (5 personas)

### 46. Test Coverage Reviewer
**Finding:** No tests exist for the `links.ts` API endpoint.
**Action:** Add E2E tests for CRUD operations on task links.
- I:3 | E:3 | R:1

### 47. Logging Auditor
**Finding:** API errors are logged via `apiError` but successful operations have no logging. No audit trail for who created/deleted links.
**Action:** Add structured logging for link mutations.
- I:2 | E:1 | R:1

### 48. Build Configuration Reviewer
**Finding:** No new build configuration needed. All files are standard Astro routes/components. Verified ✅

### 49. Documentation Auditor
**Finding:** The links API lacks OpenAPI/Swagger documentation. The JSDoc is minimal.
**Action:** Enhance JSDoc with request/response examples, error codes.
- I:2 | E:1 | R:1

### 50. Monitoring Specialist
**Finding:** No health check or metrics for link operations. If the task_links table fails to create, there's no alerting.
**Action:** Add task_links table status to the health check endpoint.
- I:2 | E:2 | R:1

---

## Summary Table

| # | Persona | Finding | I | E | R | Net | Execute? |
|---|---------|---------|---|---|---|-----|----------|
| 1 | Interaction Designer | Search loading indicator | 3 | 1 | 1 | +2 | ✅ |
| 2 | Info Architect | Link count badge | 2 | 1 | 1 | +1 | ✅ |
| 3 | Microinteraction | Link row transitions | 2 | 1 | 1 | +1 | ✅ |
| 5 | Empty State | No-links placeholder | 2 | 1 | 1 | +1 | ✅ |
| 6 | Schema Consistency | Timestamp format | 3 | 2 | 2 | +1 | ✅ |
| 7 | Referential Integrity | Orphan cleanup | 4 | 2 | 2 | +2 | ✅ |
| 8 | Idempotency | Duplicate link response | 3 | 2 | 1 | +1 | ✅ |
| 9 | Migration | Schema versioning | 3 | 3 | 2 | 0 | ✅ |
| 11 | CSS Architecture | Inline style → classes | 2 | 2 | 1 | 0 | ✅ |
| 12 | Component Reuse | TaskSearchDropdown | 4 | 3 | 2 | +1 | ✅ |
| 13 | Responsive | Label overflow | 2 | 1 | 1 | +1 | ✅ |
| 14 | Theme Consistency | Remove btn theming | 2 | 1 | 1 | +1 | ✅ |
| 16 | Module Boundary | CustomFieldRenderer | 3 | 3 | 3 | 0 | ✅ |
| 17 | API Contract | Normalize link response | 3 | 3 | 2 | 0 | ✅ |
| 18 | Error Boundary | Link fetch error state | 3 | 1 | 1 | +2 | ✅ |
| 20 | State Management | Race condition guard | 4 | 2 | 2 | +2 | ✅ |
| 21 | Input Validation | UUID format check | 3 | 1 | 1 | +2 | ✅ |
| 22 | Authorization | DELETE scope check | 4 | 1 | 1 | +3 | ✅ |
| 24 | Error Disclosure | Generic error msgs | 3 | 1 | 1 | +2 | ✅ |
| 26 | Screen Reader | aria-label on remove | 3 | 1 | 1 | +2 | ✅ |
| 27 | Keyboard Nav | Arrow key in search | 3 | 2 | 1 | +1 | ✅ |
| 28 | Color Contrast | Muted text contrast | 2 | 1 | 1 | +1 | ✅ |
| 29 | Focus Management | Re-focus after create | 2 | 1 | 1 | +1 | ✅ |
| 30 | ARIA Live | Announce link changes | 2 | 1 | 1 | +1 | ✅ |
| 32 | DOM Mutation | Toggle vs rebuild | 2 | 2 | 1 | 0 | ✅ |
| 35 | SQL Optimizer | UNION query | 2 | 2 | 1 | 0 | ✅ |
| 37 | WebSocket Events | HA event emission | 3 | 2 | 1 | +1 | ✅ |
| 39 | HA State | Link count sensor | 2 | 1 | 1 | +1 | ✅ |
| 40 | Multi-Instance | WS sync for links | 3 | 3 | 2 | 0 | ✅ |
| 41 | Bounded Context | Domain service | 3 | 3 | 2 | 0 | ✅ |
| 42 | Ubiquitous Lang | Terminology audit | 2 | 1 | 1 | +1 | ✅ |
| 44 | Domain Event | Activity log entry | 3 | 2 | 1 | +1 | ✅ |
| 45 | Value Object | Export LinkType | 2 | 1 | 1 | +1 | ✅ |
| 46 | Test Coverage | E2E link tests | 3 | 3 | 1 | 0 | ✅ |
| 47 | Logging | Structured mutation log | 2 | 1 | 1 | +1 | ✅ |
| 49 | Documentation | JSDoc enhancement | 2 | 1 | 1 | +1 | ✅ |
| 50 | Monitoring | Health check | 2 | 2 | 1 | 0 | ✅ |

Plus **i18n link labels** (en.json + ga.json) from prior deferrals.

**Total actionable items: 37** (excluding 4 verified-OK, 5 not-actioned, and deferred-prior items now included above)
