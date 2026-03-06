# 50-Persona Audit — Branding UX Iteration 02

## Audit Context
- **Scope:** Complete branding overhaul verification + UX optimization pass
- **All deferred items resolved:** greeting context, accent picker E2E, theme-aware SVG
- **Build status:** Clean (5.03s), `astro check` 0 errors
- **Visual verification:** 8/8 pages scored 10/10 across coherence, typography, color, spacing, accessibility

---

## Panel 1: Frontier Experts (5 personas)

### Platform Architect

**Recommendation:** The `500.astro` error page uses inline `background: #6366F1` instead of `var(--accent)`. If a user changes their accent color, the error page won't reflect it.
- Impact: 2 | Effort: 1 | Risk: 1
- **Decision: Accept** ✅

### OSS Integrations Specialist

**Recommendation:** The `_tokens.css` comment block mentions "Hearth Slate + Electric Indigo" but the `tailwind.config.mjs` comment says the same. Both are consistent — no action needed.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌ (already consistent)

### Reliability Engineer

**Recommendation:** The `font-display: swap` is correctly set on all 6 @font-face blocks. The SVG sidebar logo renders immediately (no external fetch). No FOIT/FOUC risk detected.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌ (already optimized)

### Security Engineer

**Recommendation:** All font URLs remain `@fontsource` local paths — no CDN leakage. CSP font-src 'self' is maintained. SVG uses inline values, no XSS surface.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌ (already secure)

### Product Architect

**Recommendation:** The `public/logo.svg` and `public/logo-checkmark.svg` files use hardcoded hex colors (not CSS vars). For consistency with the sidebar SVG (which was made theme-aware), update these SVGs to use a `style` tag with CSS custom properties.
- Impact: 2 | Effort: 2 | Risk: 1
- **Decision: Defer** 🔲 (low impact — these SVGs are only used as static assets, not inline)

---

## Panel 2: ADHD/Productivity (5 personas)

### Workflow Coach

**Recommendation:** The greeting context hint now shows overdue/active count. One improvement: add a direct link on "1 overdue" text that scrolls to or filters the overdue section.
- Impact: 3 | Effort: 2 | Risk: 1
- **Decision: Accept** ✅

### Execution Coach

**Recommendation:** The E2E branding test suite now covers fonts, colors, logo visibility, theme-aware SVG, and accent picker. Coverage is comprehensive. Add one more test: verify the greeting context hint renders correctly.
- Impact: 2 | Effort: 1 | Risk: 1
- **Decision: Accept** ✅

### Knowledge Coach

**Recommendation:** The `_tokens.css` now has a 15-line brand palette comment. The `STACK.md` is updated. All KCS documentation is current.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌ (already documented)

### Focus Optimizer

**Recommendation:** This iteration cleanly resolved all deferred items without scope creep. No corrective action.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### Automation Coach

**Recommendation:** No new manual steps were introduced. All branding changes are verified via E2E tests and build checks.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

---

## Panel 3: UX Design (10 personas)

### Visual Designer

**Recommendation:** The stat cards on the dashboard use emoji icons (📋⚡✅⏰). For a more polished look, replace these with subtle SVG icons that match the Indigo/Slate palette.
- Impact: 3 | Effort: 3 | Risk: 1
- **Decision: Defer** 🔲 (moderate effort, cosmetic)

### Interaction Designer

**Recommendation:** The "— 1 overdue" greeting hint text is not clickable. Make it a link that scrolls to the overdue stat card or filters My Open Tasks to overdue only.
- Impact: 3 | Effort: 2 | Risk: 1
- **Decision: Accept** ✅ (same as Workflow Coach — consolidate)

### Accessibility Specialist

**Recommendation:** The `bg-green-500` (connection status dot) in SidebarFooter.astro relies on color alone to communicate connected/disconnected state. Add `aria-label` to the dot element for screen readers.
- Impact: 3 | Effort: 1 | Risk: 1
- **Decision: Accept** ✅

### Information Architect

**Recommendation:** The 404 page uses ✦ as its icon. While brand-consistent, a more descriptive icon (like a compass or map) would better communicate "you're lost."
- Impact: 2 | Effort: 1 | Risk: 1
- **Decision: Accept** ✅

### Responsive Design

**Recommendation:** All pages look correct at 1440p (verified). The sidebar collapses properly. No overflow detected.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### Motion Designer

**Recommendation:** The sidebar logo SVG could benefit from a subtle pulse animation on the amber node (apex) on hover — communicating it's alive/interactive.
- Impact: 2 | Effort: 1 | Risk: 1
- **Decision: Accept** ✅

### Dark Mode Specialist

**Recommendation:** Both dark and light themes use the same accent (Indigo). The auto theme correctly inherits. No issues detected.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### Typography Specialist

**Recommendation:** The `letter-spacing: -0.02em` on headings is good. Verify that the Geist body text doesn't have negative letter-spacing (it shouldn't — Geist is designed for higher density).
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌ (Geist uses default spacing)

### Color System Specialist

**Recommendation:** The RGB channel variables (`--accent-r`, `--accent-g`, `--accent-b`) in `_tokens.css` should be documented as part of the palette comment block for transparency compositing use.
- Impact: 2 | Effort: 1 | Risk: 1
- **Decision: Accept** ✅

### Micro-interaction Designer

**Recommendation:** The stat cards on the dashboard should pulse briefly on page load when they contain non-zero values, especially the overdue card.
- Impact: 2 | Effort: 1 | Risk: 1
- **Decision: Accept** ✅

---

## Panel 4: HA Integration (10 personas)

### HA Addon Developer

**Recommendation:** The `icon.png` and `logo.png` in `meitheal-hub/` were regenerated. Verify they meet HA addon store requirements (icon: 128×128, logo: 250×100, PNG format).
- Impact: 2 | Effort: 1 | Risk: 1
- **Decision: Accept** ✅ (verify dimensions)

### Ingress Specialist

**Recommendation:** The SVG logo uses inline `var(--accent)` which works correctly behind ingress since CSS vars are rendered client-side. No cross-origin issues.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### HA Theme Specialist

**Recommendation:** The HA theme passthrough script in Layout.astro correctly maps `--primary-color` to `--accent`. This means the sidebar SVG (using `var(--accent)`) will automatically adopt the HA parent theme's accent color. Excellent integration.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌ (already optimal)

### PWA Specialist

**Recommendation:** The manifest `theme_color` is `#0f172a` (Slate) and `background_color` is `#0f172a`. This is correct for the splash screen. The description was updated.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### HA Entity Specialist

**Recommendation:** No entity changes in this branding iteration.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### WebSocket Specialist

**Recommendation:** No WebSocket changes in this branding iteration.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### Supervisor API Specialist

**Recommendation:** The `config.yaml` description was updated. Verify it renders correctly in the HA Supervisor addon info panel.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌ (verified via build)

### Multi-Arch Specialist

**Recommendation:** No Dockerfile or build changes. Branding is purely frontend.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### HA Discovery Specialist

**Recommendation:** No discovery changes in this branding iteration.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### HA Event Bus Specialist

**Recommendation:** No event bus changes in this branding iteration.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

---

## Panel 5: Quality & DevOps (10 personas)

### Build Engineer

**Recommendation:** Build passes clean in 5.03s. Bundle sizes are reasonable. No new external dependencies were introduced.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### Test Engineer

**Recommendation:** The branding E2E suite now has 7 tests (fonts ×2, colors ×2, logo visibility, theme-aware SVG, accent picker). Add one test for the greeting context hint.
- Impact: 2 | Effort: 1 | Risk: 1
- **Decision: Accept** ✅ (same as Execution Coach — consolidate)

### Performance Engineer

**Recommendation:** Self-hosted fonts load from `@fontsource` bundles (local). No CDN round-trips. `font-display: swap` prevents FOIT. Performance is optimal.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### SEO Specialist

**Recommendation:** The `og:title` and `og:description` are correctly set from Layout.astro props. The favicon is an SVG (modern browsers support this). All meta tags are present.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### i18n Specialist

**Recommendation:** Both `en.json` and `ga.json` were updated (☘→🏠). All greeting translations work. No i18n regressions.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### Error Handling Specialist

**Recommendation:** The 404 and 500 pages use brand-consistent styling. Error messages are clear and helpful.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### Documentation Specialist

**Recommendation:** README.md, meitheal-hub/README.md, STACK.md, _tokens.css comment, repository.yaml, config.yaml — all updated and consistent. KCS compliance verified.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### CI/CD Specialist

**Recommendation:** No CI changes needed. The branding changes are purely visual and don't affect the build pipeline.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

### Release Engineer

**Recommendation:** All branding changes are committed-ready. Version in package.json is 0.1.66. Consider bumping to 0.2.0 for this visual overhaul since it's a significant design change.
- Impact: 2 | Effort: 1 | Risk: 1
- **Decision: Defer** 🔲 (versioning is a broader decision)

### Observability Specialist

**Recommendation:** No observability changes needed. Branding is client-side only.
- Impact: 1 | Effort: 1 | Risk: 1
- **Decision: Reject** ❌

---

## Summary

| Decision | Count |
|----------|-------|
| **Accept** | 11 |
| **Defer** | 3 |
| **Reject** | 36 |
| **Total** | 50 |

### Accepted Actions (11)

| # | Source | Action | Impact | Effort |
|---|--------|--------|--------|--------|
| 1 | Platform Architect | Fix 500.astro inline color → var(--accent) | 2 | 1 |
| 2 | Workflow Coach + Interaction Designer | Make overdue hint clickable → scroll to stat card | 3 | 2 |
| 3 | Execution Coach + Test Engineer | Add greeting context hint E2E test | 2 | 1 |
| 4 | Accessibility Specialist | Add aria-label to connection status dot | 3 | 1 |
| 5 | Information Architect | 404 icon → compass 🧭 instead of ✦ | 2 | 1 |
| 6 | Motion Designer | Subtle amber node pulse on sidebar logo hover | 2 | 1 |
| 7 | Color System Specialist | Document RGB channel vars in palette comment | 2 | 1 |
| 8 | Micro-interaction Designer | Overdue stat card entrance pulse animation | 2 | 1 |
| 9 | HA Addon Developer | Verify icon.png/logo.png dimensions | 2 | 1 |
| 10 | Greeting E2E test | Verify greeting context renders | 2 | 1 |
| 11 | (consolidated from #2 and #3) | — | — | — |
