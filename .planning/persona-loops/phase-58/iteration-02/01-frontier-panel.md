# Panel 1 — Frontier Experts

**Phase:** 58 · **Iteration:** 02 · **Focus:** Security, Code Quality, UI/UX

---

## 🏗️ Platform Architect

**Observation:** `@keyframes skeleton-pulse` is defined twice — once in `_feedback.css:22` (gradient-based, 0→200% position) and again at `_feedback.css:65` (opacity-based, 0.4→0.15). Two different animations with the same name — second silently overrides first.

**Recommendation:** Rename the opacity-based one to `@keyframes skeleton-fade` and update `.skeleton-row`/`.skeleton-card` to use it. Keep gradient-based `skeleton-pulse` for `.skeleton-pulse` class.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 4 | 1 | 1 | **Accept** |

**Success criterion:** `grep -c '@keyframes skeleton-pulse' _feedback.css` returns `1`. Both skeleton types still animate correctly.

---

## 🔗 OSS Integrations Specialist

**Observation:** The inline SVG `data:` URIs for select dropdown arrows appear identically in both `_forms.css:15` and `_table.css:61`. This violates DRY — if the arrow SVG changes, two files need updating.

**Recommendation:** Extract the SVG data URI to a CSS custom property `--select-arrow` in `_tokens.css` and reference it via `var(--select-arrow)` in both partials.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 2 | 1 | **Accept** |

**Success criterion:** `grep -c 'data:image/svg' _forms.css _table.css` returns `0:0`. Arrow still renders on `<select>` elements.

---

## 🛡️ Security Engineer

**Observation:** The `data:image/svg+xml` URIs in `_forms.css` and `_table.css` are inert SVG (no `<script>`, no event handlers). CSP permits `data:` in `img-src` by default. The SVG is URL-encoded, not base64, which is safe. No external URL references anywhere in partials (all `url()` calls use `@fontsource` or `data:`). **No security vulnerabilities found.**

**Recommendation:** Add a CSP audit comment to `_tokens.css` documenting that all `url()` references are local — future contributors shouldn't add external CDN URLs without CSP review.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 2 | 1 | 1 | **Accept** |

**Success criterion:** Comment exists at top of `_tokens.css` documenting CSP-safe policy.

---

## 🎨 Product Architect

**Observation:** Multiple class definitions are split across partials — `.shortcut-modal-overlay` and `.shortcut-modal-content` appear in both `_modal.css` and `_feedback.css` (animation definitions). `.content-area` appears in both `_layout.css` and `_utilities.css` (page-enter animation). This creates confusing ownership — which file "owns" the style?

**Recommendation:** Consolidate: (1) move `.shortcut-modal-*` animation rules from `_feedback.css` to `_modal.css`, (2) move `.content-area` animation from `_utilities.css` to `_layout.css` where the base `.content-area` is defined.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 4 | 2 | 2 | **Accept** |

**Success criterion:** Each class has exactly one owning partial. `grep -l 'shortcut-modal' _*.css` returns only `_modal.css`. `grep -l 'content-area' _*.css` returns only `_layout.css`.

---

## 🧭 Reliability Engineer

**Observation:** `_responsive.css` contains 27 `!important` overrides — most from mobile touch targets and print styles. While `!important` is reasonable for media queries that MUST override component styles, some are unnecessary (e.g., `font-size: 13px` for `.search-input` at mobile, `gap: 8px !important` for `.stats-grid`).

**Recommendation:** Audit each `!important` in `_responsive.css` — remove where cascade already handles specificity (e.g., media query context is sufficient). Keep only where truly fighting component specificity.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 3 | 3 | **Defer** |

**Success criterion:** `grep -c '!important' _responsive.css` drops from 27 to ≤15. No visual regressions at mobile width.

**Defer rationale:** High effort-to-impact ratio for a purely stylistic improvement. Requires mobile testing for each removal.
