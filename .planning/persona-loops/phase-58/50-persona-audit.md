# 50-Persona Cross-Phase Audit — Phase 58 (CSS Domain Split)

**Date:** 2026-03-05
**Scope:** Phase 58 (CSS Tailwind V4 Migration, Domain Splitting, HA Ingress Rendering)

## Audit Matrix

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 1 | CSS Architect | Architecture | Import order in `global.css` relies on implicit PostCSS behavior rather than explicit `@layer` for all partials. | ⚠️ Med | Enforce `@layer` everywhere |
| 2 | Tailwind Expert | Config | `@apply` usage for structural layouts (flex/grid) instead of utility classes in templates hides layout intent. | ℹ️ Low | Use utility classes for layout |
| 3 | DDD Specialist | Boundaries | `_forms.css` contains `settings-grid` which is a layout concept, crossing bounded contexts. | ℹ️ Info | Moved to _layout.css |
| 4 | QA Lead | Regression | Extraction of 18 CSS classes highlights lack of visual regression testing (VRT) in CI. | ⚠️ Med | Setup Playwright VRT |
| 5 | Performance Eng | Build | Vite CSS extraction duplicates some utility classes across dynamically imported Astro components. | ℹ️ Low | Acceptable bundle size |
| 6 | HA Addon Expert | Ingress | Relying on `body.ha-ingress` for CSS hiding can cause FOUC before JS injects class. | ⚠️ Med | Inject class at server edge |
| 7 | Accessibility Eng | UX | `.priority-dot` uses color exclusively to convey meaning (fails WCAG 1.4.1). | ⚠️ Med | Add hidden text labels |
| 8 | UX Engineer | Modals | `.modal-overlay` lacks backdrop-filter fallback for older browsers rendering transparent overlays. | ℹ️ Low | Add fallback rgba |
| 9 | Mobile Developer | Touch | `.bento-card-actions` hover-only reveal makes actions inaccessible on touch devices. | ⚠️ Med | Add active state/always visible |
| 10 | Security Engineer | CSS Injection | No user input controls CSS vars, safe from CSS injection vectors. | ℹ️ Info | Correct |
| 11 | Build Engineer | PostCSS | Tailwind `theme()` function usage in `.astro` files drops caching optimization. | ℹ️ Low | Use standard variables |
| 12 | Theming Architect | Dark Mode | Hardcoded rgba colors in toast backgrounds break dark mode contrast ratios. | ⚠️ Med | Use semantic tokens |
| 13 | Animation Specialist | UX | Toast animation `fade-in-up` lacks a complementary exit animation. | ℹ️ Low | Add exit animation |
| 14 | Responsive Designer | Layout | `.settings-grid` uses hardcoded breakpoints which may conflict with container queries. | ℹ️ Low | Evaluate container queries |
| 15 | DevOps | CI | Prettier doesn't enforce CSS property ordering in split files. | ℹ️ Low | Add Stylelint to CI |
| 16 | Font Renderer | Typography | `Inter` variable font payload increases LCP due to lack of `size-adjust`. | ℹ️ Info | Optimization backlog |
| 17 | Color Vision Eng | UI | Status badge backgrounds (success/warning/error) contrast ratio is < 4.5:1 against card backgrounds. | ⚠️ Med | Increase contrast |
| 18 | Focus Management | UX | Focus rings on `.btn` are suppressed by custom `.focus-visible` overrides in some partials. | ⚠️ Low | Standardize focus rings |
| 19 | Network Engineer | Assets | Favicon changed to root `/favicon.svg`, bypassing cache-busting hashing. | ℹ️ Low | Use Vite asset imports |
| 20 | State Specialist | Sync | Skeleton loaders animate indefinitely without a timeout mechanism on stalled requests. | ℹ️ Low | Add timeout boundary |
| 21 | L10n Specialist | Layout | Fixed widths in `.bento-card-actions` will clip German translations of tooltips. | ℹ️ Low | Use `min-width` |
| 22 | Container Eng | Runtime | CSS rules for HA Ingress assume fixed viewport inject dimensions. | ℹ️ Info | Acceptable for HA |
| 23 | Component Architect | React | Astro components using direct `<style>` conflict with global utility priorities. | ⚠️ Med | Remove scope conflicts |
| 24 | Content Strategist | Modals | `modal-title` font sizing competes with page `h1`, breaking visual hierarchy. | ℹ️ Low | Reduce font weight |
| 25 | SRE | Resilience | Unhandled CSS import errors cause Vite dev server crash instead of fallback. | ℹ️ Low | Update Vite config |
| 26 | Cognitive Ergonomics | UI | Too many distinct border subtle colors in dark mode increase visual noise. | ℹ️ Low | Tidy color palette |
| 27 | Interaction Designer | UI | Hamburger menu hover state transitions color but lacks transform/scale feedback. | ℹ️ Info | Minor enhancement |
| 28 | Lighthouse Auditor | Perf | CLS impact from lazy-loaded web fonts causing text reflow in `.stat-value`. | ⚠️ Med | Use font-display: optional |
| 29 | I18n Engineer | RTL | Margins in `.status-indicator` use `margin-left` instead of logical `margin-inline-start`. | ⚠️ Med | Convert to logical props |
| 30 | Frontend Architect | Tooling | Migration to Tailwind v4 shifts complexity from config files to CSS vars; documentation lacking. | ℹ️ Low | Write v4 standard doc |
| 31 | Data Viz Eng | Dashboards | Chart CSS missing from `_cards.css` and un-migrated. | ℹ️ Info | Charts not yet implemented |
| 32 | Audit Trail Eng | Observability| CSS errors/warnings in client runtime not sent to Sentry. | ℹ️ Info | By design |
| 33 | PWA Engineer | Offline | PWA manifest theme_color hardcoded, doesn't respect system dark/light mode preference. | ⚠️ Low | Update meta tag via JS |
| 34 | Screen Reader Eng | Modals | Generic modals lack `aria-modal="true"` and `role="dialog"` bindings in DOM. | ⚠️ Med | Add ARIA to modal components |
| 35 | Testing Architect | E2E | No Playwright tests cover HA ingress specific CSS rendering. | ⚠️ Med | Add headless HA fixture |
| 36 | Motion Designer | UX | Skeleton `pulse` animation is too fast (2s); creates strobe effect. Recommend 3s duration. | ℹ️ Low | Adjust animation timing |
| 37 | Clean Coder | Tech Debt | 14 partials contain mixed naming conventions (BEM vs Tailwind utilities). | ℹ️ Low | Standardize |
| 38 | Maintenance Eng | Docs | Missing dependency map mapping Astro components to CSS partials. | ℹ️ Info | Add to STRUCTURE.md |
| 39 | API Gateway Eng | Routing | Clean URLs require explicit trailing slash for CSS chunk resolution behind proxies. | ⚠️ Low | Handle in Vite base |
| 40 | Chaos Engineer | Failure | Missing CSS chunks on slow connections render unreadable text instead of skeletons. | ℹ️ Info | Rare edge case |
| 41 | Edge Architect | Delivery | Pre-compressed Brotli CSS files not generated during Vite build. | ℹ️ Low | Use vite-plugin-compression |
| 42 | Product Manager | User Value | Deep refactor provided no user-facing features, risking project momentum. | ℹ️ Info | Tech debt payment complete |
| 43 | Tech Writer | KCS | No root README update regarding the new CSS partial architecture. | ⚠️ Med | KCS artifact creation needed |
| 44 | Mac Expert | Safari | iOS Safari cuts off `padding-bottom` on `.settings-grid` in certain viewport heights. | ⚠️ Low | Add safe-area-inset |
| 45 | Android Developer | Chrome | Android Chrome address bar hiding causes 100vh height jumps in layout. | ⚠️ Med | Use `dvh` unit instead of `vh` |
| 46 | Print CSS Eng | Export | No `@media print` rules; printing KanBan board yields black boxes. | ℹ️ Low | Add print partial |
| 47 | Cache Specialist | HTTP | Missing `Cache-Control` immutable headers for immutable CSS assets. | ⚠️ Med | Add Cloudflare headers |
| 48 | Webhook Eng | Comms | (N/A for CSS) | ℹ️ Info | Skip |
| 49 | Offline Architect | Sync | Badge classes loaded dynamically may not be precached by Service Worker. | ⚠️ Med | Verify SW precache manifest |
| 50 | Release Engineer | Deployment | CSS split is high risk if rollback needed; require blue-green deploy. | ℹ️ Info | Handled by HA Addon rollout |

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| ⚠️ Med | 15 | Prioritize in GSD Persona Loop |
| ⚠️ Low | 7  | Defer to optimization |
| ℹ️ Low | 15 | Backlog |
| ℹ️ Info | 13 | Acknowledge |

## Immediate Actions
1. Convert margins to Logical Properties (`margin-inline-start`) for future RTL safety.
2. Fix HA Ingress jump by moving `ha-ingress` class injection to the server edge.
3. Fix touch accessibility for hover-only `.bento-card-actions`.
4. Initiate GSD Persona Loop Iteration 2 to resolve high priority items.
