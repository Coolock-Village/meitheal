# Phase 58 — Persona Audit: CSS Domain Split

**Date:** 2026-03-04
**Phase:** 58 — CSS Domain Split
**Auditors:** Architect, DDD Specialist, UX Engineer, DevOps

---

## 🏗️ Architect

### Observations
- **A1.** 2271-line monolith violates separation of concerns. Single `@layer components` block contains sidebar, kanban, table, bento, modal, and search styles with no module boundary.
- **A2.** Duplicate `.btn` definitions at L474 and L1366 — different properties, same selector. Second definition silently overrides first depending on source order. Must consolidate.
- **A3.** `@tailwind` directives must remain in the entry file that Astro processes. Partials should NOT include `@tailwind` statements or they'll be processed multiple times.
- **A4.** CSS `@import` is resolved statically by PostCSS/Tailwind during build — no runtime cost. But import order matters for cascade.

### Recommendations
- Consolidate `.btn` into a single canonical definition in `_buttons.css`
- Keep `_tokens.css` first (fonts + variables used everywhere)
- `_base.css` second (resets depend on tokens)
- Component partials can be in any order after base
- `_responsive.css` last (media queries override component styles)

### Risk: LOW
No runtime impact. Build tool resolves imports. Only risk is missing a selector during extraction.

---

## 🧩 DDD Specialist

### Observations
- **D1.** CSS domain boundaries should align with code-level DDD: `auth/`, `tasks/`, `ha/`, `todo/`, `integrations/`. The proposed 14 partials map well to UI domain boundaries rather than backend domains — this is correct for styling.
- **D2.** `_tasks.css` groups task-item + bento grid + checklist + task-detail — these all belong to the Tasks bounded context. Good cohesion.
- **D3.** `_kanban.css` groups board + columns + cards + drag-drop + lane management — single bounded context. Correct.
- **D4.** Filter/filter-summary-bar could go in tasks or table. Recommend tasks since it's used on the tasks page primarily.

### Recommendations
- Priority classes (`.priority-critical`, `.priority-high`) belong in `_tasks.css` not `_table.css` — they're domain-level, not presentation-level.
- `.settings-grid` (L967) is tiny — keep in `_layout.css` rather than creating a separate settings partial.

### Risk: LOW
Clear bounded context mapping. No cross-domain confusion risk.

---

## 🎨 UX Engineer

### Observations
- **U1.** No visual changes expected — this is pure file organization. CSS output is identical.
- **U2.** Loading indicator CSS was just added to `global.css` in Phase 57 — should go in `_feedback.css` or `_tokens.css` depending on whether it's a design token or a component. It's a component → `_feedback.css`.
- **U3.** `.page-loading-bar` (L172-205) vs the new `.meitheal-loading-bar` (in Layout.astro `<style is:inline>`) — two loading indicators. The global.css one should be extracted to `_feedback.css`. The Layout.astro inline one is separate (page transition, not navigation).

### Recommendations
- Verify both loading indicators don't conflict visually
- Run browser check on at least Dashboard + Kanban + Settings after split

### Risk: LOW

---

## ⚙️ DevOps

### Observations
- **O1.** CI brace-balance check runs `scripts/check-css-braces.sh` — this currently checks `global.css`. After split, it needs to check all CSS files in `src/styles/`.
- **O2.** Font path CI guard (`ci.yml:109-115`) checks build output — unaffected by source split.
- **O3.** Build time should be unaffected — PostCSS/Tailwind processes all imports as a single stylesheet.

### Recommendations
- Update `scripts/check-css-braces.sh` to glob `src/styles/*.css`
- Or confirm CI already checks all CSS files

### Risk: LOW — verify brace check script scope

---

## Summary

| Persona | Findings | Severity | Risk |
|---------|----------|----------|------|
| Architect | 4 (duplicate .btn, import order, @tailwind placement, cascade) | Med | LOW |
| DDD Specialist | 4 (domain alignment, filter placement, priority classes, settings-grid) | Low | LOW |
| UX Engineer | 3 (no visual change, loading indicator split, browser verify) | Low | LOW |
| DevOps | 3 (brace check scope, font guard OK, build time OK) | Med | LOW |

**Total findings:** 14
**Action items:** 3 (consolidate .btn, update brace check, browser verify)
**Overall risk:** LOW — zero runtime change, pure organizational refactor
