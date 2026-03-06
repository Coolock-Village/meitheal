# Panel 1: Frontier Experts — Branding Overhaul UX Audit

## Platform Architect
**Recommendation:** Add `font-display: swap` to all `@font-face` declarations in `_tokens.css` to prevent invisible text during font loading (FOIT). Currently fonts load but could flash if network is slow behind HA ingress.
- Impact: 3 (Moderate — prevents flash on first load)
- Effort: 1 (Trivial — add one property to each @font-face block)
- Risk: 1 (No regression risk)
- **Decision: Accept** ✅

## OSS Integrations Specialist
**Recommendation:** The `@fontsource-variable/geist` package is a community-maintained mirror of Vercel's Geist. Pin the version in `package.json` to avoid breaking changes on minor bumps since Geist is still pre-1.0.
- Impact: 2 (Minor — prevents surprise font changes)
- Effort: 1 (Trivial — version already pinned by pnpm lockfile)
- Risk: 1 (No regression)
- **Decision: Accept** ✅

## Reliability Engineer
**Recommendation:** Add a `preload` link for Outfit-700 (the heaviest heading weight) in the Layout `<head>` to reduce layout shift on first paint. Currently all font weights load on demand which can cause CLS on heading-heavy pages.
- Impact: 3 (Moderate — reduces CLS)
- Effort: 1 (Trivial — one `<link rel="preload">` tag)
- Risk: 1 (No regression)
- **Decision: Accept** ✅

## Security Engineer
**Recommendation:** No security concerns identified with the branding changes. All fonts are self-hosted (no CDN), no new external dependencies, no user-input surfaces changed.
- Impact: 1 (Negligible — already secure)
- Effort: 1 (No action needed)
- Risk: 1 (No risk)
- **Decision: Reject** ❌ (No actionable change)

## Product Architect
**Recommendation:** The sidebar logo SVG uses hardcoded hex colors (`#0F172A`, `#6366F1`, `#F59E0B`) making it theme-unaware. When a user picks a custom accent color in Settings, the sidebar logo won't update. Use `currentColor` or CSS custom properties for the accent strokes.
- Impact: 4 (Significant — breaks user customization expectation)
- Effort: 2 (Small — refactor SVG to use CSS vars)
- Risk: 2 (Low — isolated to sidebar)
- **Decision: Accept** ✅
