# Frontier Expert Panel — Phase 57: UI/UX + HA Optimization

**Phase:** 57 — UI/UX Polish Wave + HA Deep Integration
**Iteration:** 01
**Date:** 2026-03-04

---

## 1. Platform Architect

**Recommendation:** Split `global.css` (2224 lines) into domain-scoped CSS modules per Astro component.

- `global.css` is a monolith — dashboard styles, kanban styles, settings styles, and bento-grid all in one file
- Astro natively supports scoped `<style>` blocks per component — use them
- Extract dashboard-specific styles (`.stat-card`, `.bento-grid`, `.bento-card`) into `Dashboard.astro` scoped styles
- Extract kanban-specific styles into `Kanban.astro` scoped styles
- Keep only true global tokens (colors, typography, layout primitives) in `global.css`

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 4 | 4 | 2 | **Defer** — high-impact but high-effort refactor; schedule for dedicated CSS phase |

---

## 2. OSS Integrations Specialist

**Recommendation:** Add HA theme variable passthrough so Meitheal respects the user's HA theme colors.

- HA exposes CSS custom properties on the ingress iframe (e.g. `--primary-color`, `--accent-color`, `--text-primary-color`)
- Meitheal currently uses its own hardcoded dark theme variables
- Map HA theme vars to Meitheal's `--accent`, `--bg-primary`, `--text-primary` when running inside ingress
- Detect via `window.__ingress_path` presence — if set, cascade HA vars; if standalone, use defaults
- Minimal CSS: `@media (prefers-color-scheme: dark) { :root { --accent: var(--primary-color, #10b981); } }`

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 5 | 2 | 2 | **Accept** — native HA feel with minimal effort |

---

## 3. Reliability Engineer

**Recommendation:** Add CSS build validation to CI — catch brace/syntax errors before deploy.

- The `global.css` unclosed brace bug (line 1180) broke the entire app at build time
- PostCSS parser catches these, but only at `npm run build` — there's no standalone CSS lint step
- Add a CI step: `npx postcss src/styles/global.css --no-map` to validate syntax
- Also add a brace-balance check as a governance test (like `grep -c '{' | grep -c '}'`)
- Prevents future CSS syntax regressions from reaching production

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 4 | 1 | 1 | **Accept** — trivial addition, prevents recurring issue |

---

## 4. Security Engineer

**Recommendation:** Audit CSP `style-src` directive — ensure `unsafe-inline` isn't used for component styles.

- Current CSP in `middleware.ts` sets headers but hasn't been validated against all style injection points
- Astro's scoped `<style>` blocks generate inline styles by default — may conflict with strict CSP
- If CSP is `style-src 'self'` only, scoped styles may break in strict mode
- Verify with: load app with `Content-Security-Policy-Report-Only` and check for violations
- No code change needed if current config works — just validate

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 1 | 1 | **Accept** — quick validation, security hygiene |

---

## 5. Product Architect

**Recommendation:** Add user-configurable accent color in Settings → General, with HA theme auto-detect fallback.

- Currently accent color is hardcoded (`#10b981` emerald)
- Users may want to match their HA dashboard colors or personal preference
- Store as `settings.accent_color` in SQLite
- Load via `Astro.locals` into `:root` CSS variable
- Default: HA theme color if available, else emerald

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 4 | 3 | 1 | **Accept** — enhances premium feel and HA integration |

---

## Summary

| # | Persona | Recommendation | Decision |
|---|---------|----------------|----------|
| 1 | Platform Architect | Split global.css into scoped modules | Defer |
| 2 | OSS Integrations | HA theme variable passthrough | **Accept** |
| 3 | Reliability Engineer | CSS build validation in CI | **Accept** |
| 4 | Security Engineer | Audit CSP style-src directive | **Accept** |
| 5 | Product Architect | User-configurable accent color | **Accept** |
