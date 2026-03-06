# Panel 2: ADHD/Productivity Specialist Analysis
## Phase 32 — Task Items UX Fixes · Iteration 01

**Objective:** Review the 5 Task Items UX fixes for cognitive load, workflow friction, automation opportunities, and knowledge capture.

---

### 1. Workflow Coach

**Recommendation:** The custom field "Add Field" dropdown requires 3 clicks (click "+", search/select field, then enter value) — but there's no visual indicator of what field types are available or what they'll look like. Add inline type badges (📝 Text, ☑️ Checkbox, 📊 Select, etc.) next to field names in the dropdown to reduce cognitive load and prevent wrong-type selection.

- **Impact:** 3 — Moderate improvement to field selection speed and accuracy
- **Effort:** 1 — Trivial — add emoji/badge to existing dropdown HTML
- **Risk:** 1 — No regression risk
- **Decision:** ✅ Accept — `impact >= effort`, concrete and testable

**Success Criterion:** Custom field dropdown shows type badge next to each field name.

---

### 2. Execution Coach

**Recommendation:** The activity log lazy-loads only on `<details>` toggle — but there's no loading state or skeleton UI. Users who expand the section see a flash of empty content before entries load. Add a skeleton/spinner state ("Loading activity…") that appears immediately on toggle, replaced by actual content.

- **Impact:** 3 — Moderate UX improvement, reduces perceived stutter
- **Effort:** 1 — Trivial — activity div already has loading state but it's set in the async callback; move it to the toggle handler
- **Risk:** 1 — No regression risk
- **Decision:** ✅ Accept — `impact >= effort`, already partially implemented

**Success Criterion:** Expanding activity section shows "Loading…" immediately, no flash of empty space.

---

### 3. Knowledge Coach

**Recommendation:** The `task_links` API endpoint and the custom field select options have no inline documentation or API contract. Add JSDoc comments to `links.ts` describing the request/response shapes, valid `link_type` values, and error codes. This enables future-me to understand the API without reading the implementation.

- **Impact:** 3 — Moderate improvement — KCS compliance
- **Effort:** 1 — Trivial — add JSDoc to existing functions
- **Risk:** 1 — No regression risk
- **Decision:** ✅ Accept — `impact >= effort`, concrete

**Success Criterion:** `links.ts` has JSDoc with request/response examples for GET, POST, DELETE.

---

### 4. Focus Optimizer

**Recommendation:** The related links search and parent search are two nearly identical implementations (debounced fetch → render results → click handler → save). This is a code duplication smell — extract a shared `TaskSearchDropdown` utility function that both parent search and link search use. This reduces the cognitive load of maintaining two parallel search implementations.

- **Impact:** 4 — Reduces maintenance surface and bug risk
- **Effort:** 3 — Medium — extract shared function, update two call sites
- **Risk:** 2 — Low risk, both search implementations are isolated
- **Decision:** ✅ Accept — `impact >= effort`, concrete and testable

**Success Criterion:** Single `initTaskSearchDropdown(inputEl, resultsEl, onSelect)` function used by both parent search and link search.

---

### 5. Automation Coach

**Recommendation:** Custom field select options are defined as comma-separated text in the settings page — but there's no validation that options are unique or non-empty. Add client-side deduplication and empty-string filtering when saving select options, and show a warning toast if duplicates are detected.

- **Impact:** 3 — Prevents data quality issues from bad option definitions
- **Effort:** 1 — Trivial — already filtering with `.filter(Boolean)`, add `.filter((v, i, a) => a.indexOf(v) === i)`
- **Risk:** 1 — No regression risk
- **Decision:** ✅ Accept — `impact >= effort`, concrete and testable

**Success Criterion:** Duplicate and empty options are stripped on save; toast warns if duplicates were removed.

---

## Panel 2 Summary

| Persona | Recommendation | I | E | R | Decision |
|---------|---------------|---|---|---|----------|
| Workflow Coach | Type badges in custom field dropdown | 3 | 1 | 1 | Accept |
| Execution Coach | Activity log loading state on toggle | 3 | 1 | 1 | Accept |
| Knowledge Coach | JSDoc API contracts for links.ts | 3 | 1 | 1 | Accept |
| Focus Optimizer | Extract shared TaskSearchDropdown utility | 4 | 3 | 2 | Accept |
| Automation Coach | Deduplicate select field options on save | 3 | 1 | 1 | Accept |
