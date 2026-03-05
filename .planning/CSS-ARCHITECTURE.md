# CSS Architecture and Strategy (Phase 58)

As of Phase 58, the application uses **Tailwind CSS v4** coupled with a strict **Domain-Driven Design (DDD)** approach for custom CSS.

## 1. The Death of the Monolith
Previously, all custom CSS lived in a single 1200+ line `global.css` file. This violated bounded contexts because auth styles lived next to layout grids and modal animations.

We split `global.css` into 14 distinct domain partials.

## 2. The 14 Domain Partials
Located in `apps/web/src/styles/`:

**Foundation**
- `_base.css` — Resets, typography, scrollbar, global focus-visible
- `_tokens.css` — Design tokens, light/dark themes, CSS variables (Tailwind v4 vars)
- `_utilities.css` — a11y classes (`.sr-only`), view transitions, reduced motion, skeletons

**Components**
- `_buttons.css` — `.btn`, `.btn-primary`, `.btn-icon`
- `_cards.css` — `.card`, `.bento-card`
- `_forms.css` — Inputs, selects, settings grids
- `_typography.css` — Headings, badges
- `_layout.css` — Sidebar, top nav, main content grid, stats cards
- `_modal.css` — Overlays, dialogs, headers, actions
- `_feedback.css` — Toasts, error boundaries, empty states
- `_search.css` — Command palette, search results
- `_brand.css` — Unified logo marks

**Business Domains**
- `_tasks.css` — Task lists, kanban boards, priority dots, due dates
- `_auth.css` — Login screen, lock screen

## 3. Tailwind v4 Integration
- `global.css` is now just a manifest file that uses `@import` to load the 14 partials.
- PostCSS combines these and injects them into the `@layer components` and `@layer base` contexts.
- Tailwind v4 uses CSS variables (defined in `_tokens.css`) instead of a `tailwind.config.js` file for theming.

**Rule:** Never write CSS in `.astro` components (`<style>`). All CSS must belong to one of the 14 domain partials to ensure it is processed by the global Tailwind pipeline and injected into HA ingress contexts correctly.
