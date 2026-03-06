# Panel 1: Frontier Expert Analysis
## Phase 32 — Task Items UX Fixes · Iteration 01

**Objective:** Audit the 5 Task Items UX fixes for architecture, data integrity, security, integration alignment, and domain coherence.

**Scope:** Checkbox rendering, Select/dropdown custom fields, Activity log parsing, Strategic lens multi-select, Jira-style task_links.

---

### 1. Platform Architect

**Recommendation:** The `task_links` table uses `TEXT PRIMARY KEY` with `crypto.randomUUID()` — which is correct for SQLite. However, the `addCFRow` function is a 60-line monolith that combines HTML generation, event binding, and state management in one function. Extract a `CustomFieldRenderer` class or factory to separate concerns and enable testing.

- **Impact:** 3 — Moderate improvement to maintainability and testability
- **Effort:** 3 — Refactor addCFRow into a factory pattern (~1-2 hours)
- **Risk:** 3 — Touches shared UI code used by all custom field rendering
- **Decision:** ✅ Accept — `impact >= effort`, concrete and testable

**Success Criterion:** `addCFRow` delegates to type-specific renderer functions; each renderer is < 15 lines.

---

### 2. OSS Integrations Specialist

**Recommendation:** The `attachStrategicLens` function now makes a `fetch("/api/settings")` call every time a task detail opens. This is an N+1 problem — settings are already loaded at page init in the main Layout script. Cache the settings response in a module-level variable and reuse it instead of re-fetching.

- **Impact:** 4 — Significant improvement to perceived load time and server load
- **Effort:** 1 — Trivial — pass cached settings as parameter or use window global
- **Risk:** 1 — No risk of regression, settings rarely change mid-session
- **Decision:** ✅ Accept — `impact >= effort`, concrete and testable

**Success Criterion:** `attachStrategicLens` uses cached settings; zero additional network requests when opening task details.

---

### 3. Reliability Engineer

**Recommendation:** The `links.ts` DELETE endpoint reads `link_id` from `request.json()` — but HTTP DELETE with a JSON body is non-standard and some proxies/caches strip DELETE bodies. Use URL query parameter `?link_id=xxx` instead for DELETE, matching RESTful conventions.

- **Impact:** 4 — Prevents silent failures behind HA Supervisor ingress proxy
- **Effort:** 2 — Small change to DELETE handler + client-side fetch call
- **Risk:** 2 — Low risk, isolated endpoint
- **Decision:** ✅ Accept — `impact >= effort`, concrete and testable

**Success Criterion:** DELETE endpoint uses query parameter; works correctly through HA ingress proxy.

---

### 4. Security Engineer

**Recommendation:** The `addCFRow` function uses `innerHTML` with string interpolation for user-provided field names and values — this is an XSS vector. Although values come from the API, a stored XSS attack could inject malicious content via custom field names. Use `textContent` for labels and `setAttribute` for values instead of template literals in `innerHTML`.

- **Impact:** 5 — Critical — prevents XSS via stored custom field payloads
- **Effort:** 3 — Medium — requires refactoring innerHTML to DOM API calls
- **Risk:** 3 — Moderate — touches rendering across all custom field types
- **Decision:** ✅ Accept — `impact >= effort`, critical security fix

**Success Criterion:** No `innerHTML` with user-provided data in custom fields or link rendering; all user content set via `textContent` or `setAttribute`.

---

### 5. Product Architect

**Recommendation:** The link type labels use hardcoded English strings with emoji (e.g., "🔗 Related to", "🚫 Blocked by"). These should use the existing i18n system (`en.json`/`ga.json`) for consistency with the rest of the app, and to support the Irish language localization.

- **Impact:** 3 — Moderate — ensures feature parity with existing i18n
- **Effort:** 2 — Small — add ~10 translation keys + reference them
- **Risk:** 1 — No regression risk
- **Decision:** ✅ Accept — `impact >= effort`, concrete and testable

**Success Criterion:** Link type labels render using `t("task.link_type.blocked_by")` pattern; Irish translations present.

---

## Panel 1 Summary

| Persona | Recommendation | I | E | R | Decision |
|---------|---------------|---|---|---|----------|
| Platform Architect | Extract CustomFieldRenderer from addCFRow | 3 | 3 | 3 | Accept |
| OSS Integrations | Cache settings to avoid N+1 fetch in attachStrategicLens | 4 | 1 | 1 | Accept |
| Reliability Engineer | DELETE links via query param not JSON body | 4 | 2 | 2 | Accept |
| Security Engineer | Eliminate innerHTML XSS vectors in custom fields/links | 5 | 3 | 3 | Accept |
| Product Architect | i18n link type labels for en/ga parity | 3 | 2 | 1 | Accept |
