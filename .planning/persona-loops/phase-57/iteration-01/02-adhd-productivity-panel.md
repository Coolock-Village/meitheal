# Panel 2: ADHD/Productivity Specialists — Phase 57

## Workflow Coach

**Recommendation:** Add a "Jump to Agents & AI" link inside the webhooks differentiation callout so users don't have to manually find the tab. Reduces navigation friction.

- **Impact:** 3 — Reduces cognitive load for users who landed on wrong tab
- **Effort:** 1 — One `<a>` tag with tab-switch JS
- **Risk:** 1 — Isolated change
- **Decision:** ✅ Accept (3 >= 1, concrete)

## Execution Coach

**Recommendation:** The n8n mode toggle state should persist to settings/localStorage so users don't re-select "Standalone" on every page load.

- **Impact:** 4 — Significant friction reduction for standalone users who revisit settings
- **Effort:** 2 — Read/write one localStorage key in init function
- **Risk:** 1 — Isolated, no server-side impact
- **Decision:** ✅ Accept (4 >= 2, testable: verify localStorage persistence)

## Knowledge Coach

**Recommendation:** Update `.planning/codebase/INTEGRATIONS.md` to document the new explainer dialog pattern, mode-tabs pattern, and Grocy auto-detection flow for future contributors.

- **Impact:** 3 — Documentation enables future-me and contributors
- **Effort:** 2 — Update existing doc with 3 new sections
- **Risk:** 1 — Documentation only
- **Decision:** ✅ Accept (3 >= 2, concrete)

## Focus Optimizer

**Recommendation:** The Phase 57 scope is well-contained — all changes are in `SettingsIntegrations.astro` + `global.css`. No scope creep observed. No action needed.

- **Impact:** 1 — Already clean
- **Effort:** 1 — N/A
- **Risk:** 1 — N/A
- **Decision:** ❌ Reject (no action needed)

## Automation Coach

**Recommendation:** Add a `cal-entity` value read from settings API on page load to pre-select the active calendar in the dropdown, so users see their current selection immediately.

- **Impact:** 4 — Critical for UX — users won't know their current setting without this
- **Effort:** 2 — Add one fetch + select logic in `initCalendarDropdown()`
- **Risk:** 1 — Already fetching, just need to set `selected`
- **Decision:** ✅ Accept (4 >= 2, the code already has a placeholder for `activeEntity`)
