# Panel 1: Frontier Experts — Phase 57 Integrations Iteration

## Platform Architect

**Recommendation:** Add `aria-live="polite"` to dynamic status containers (`#cal-auto-info`, `#grocy-auto-info`, `#n8n-auto-info`) so screen readers announce auto-detection results.

- **Impact:** 3 — Moderate accessibility improvement for dynamic content announcements
- **Effort:** 1 — Add one attribute to 3 elements
- **Risk:** 1 — Zero regression risk
- **Decision:** ✅ Accept (3 >= 1, concrete, testable: verify `aria-live` attribute exists)

## OSS Integrations Specialist

**Recommendation:** Use the established `@home-assistant/frontend` addon naming convention (`a0d7b954_nodered`) from `hassio-addons/app-node-red` for Node-RED auto-detection, same as the Grocy auto-detect pattern.

- **Impact:** 4 — Enables automatic n8n/Node-RED detection for HA users
- **Effort:** 2 — Add one fetch call + DOM update, pattern exists from Grocy
- **Risk:** 2 — Isolated change, fallback already in place
- **Decision:** ✅ Accept (4 >= 2, concrete slug available)

## Reliability Engineer

**Recommendation:** Add a `data-init` guard to `initExplainerDialog()` to prevent duplicate event listener registration on repeated Astro page-load events.

- **Impact:** 3 — Prevents potential double-click behavior after client navigation
- **Effort:** 1 — One line guard check
- **Risk:** 1 — Pattern already used in other init functions
- **Decision:** ✅ Accept (3 >= 1, testable: verify no duplicate listeners)

## Security Engineer

**Recommendation:** The explainer dialog uses `innerHTML` for body content from `EXPLAINER_CONTENT`, which is purely static inline strings (not user input). No XSS risk. No action needed.

- **Impact:** 1 — No meaningful security gain; content is hardcoded
- **Effort:** 3 — Would require refactoring to DOM API for static content
- **Risk:** 1 — No risk in current state
- **Decision:** ❌ Reject (1 < 3, impact below effort)

## Product Architect

**Recommendation:** Rename "Connection Mode" label in n8n card to "Integration Mode" for consistency with domain language. The card is about workflow integration, not network connections.

- **Impact:** 2 — Minor language consistency improvement
- **Effort:** 1 — One string change
- **Risk:** 1 — No regression
- **Decision:** ✅ Accept (2 >= 1, concrete)
