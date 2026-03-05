# Frontier Panel - Panel 1: Frontier Experts

**Objective:** Phase 58 CSS Split Refinement and HA Ingress Hardening

## 1. Platform Architect
**Recommendation:** Move `ha-ingress` class injection from client-side JS to server-edge middleware/Astro locals to prevent FOUC (Flash of Unstyled Content) where desktop navigation flashes before hiding in HA.
*Impact:* 4 | *Effort:* 2 | *Risk:* 3 | **Decision: ACCEPT**

## 2. OSS Integrations Specialist
**Recommendation:** Extract the newly restored hardcoded `rgba` background colors in `_feedback.css` (for `toast.success`, etc.) into semantic design tokens in `_tokens.css` to ensure dark mode contrast accessibility.
*Impact:* 3 | *Effort:* 1 | *Risk:* 1 | **Decision: ACCEPT**

## 3. Reliability Engineer
**Recommendation:** Implement CSS fallback for `backdrop-filter` on `.modal-overlay` using a semi-transparent `rgba` background color, so modals remain usable on older browsers or devices where backdrop filters fail.
*Impact:* 3 | *Effort:* 1 | *Risk:* 1 | **Decision: ACCEPT**

## 4. Security Engineer
**Recommendation:** No primary CSS vulnerabilities found. Recommend enforcing trailing slashes in Vite build config to prevent reverse-proxy cache poisoning or 404s when loading chunked CSS assets in HA.
*Impact:* 3 | *Effort:* 2 | *Risk:* 3 | **Decision: DEFER** (Handle in dedicated proxy/routing phase)

## 5. Product Architect
**Recommendation:** Update `.bento-card-actions` in `_cards.css` to be accessible on touch devices by removing the strict `:hover` requirement and adding an `.active` state or keeping them visible on mobile viewports.
*Impact:* 4 | *Effort:* 1 | *Risk:* 1 | **Decision: ACCEPT**

## Rejected or Deferred

{{ ... }}
