# Phase 16: Astro Optimizations & UX — Context

**Gathered:** 2026-02-28
**Status:** Executed (reconciled with plan/summary artifacts)

## Phase Boundary

Phase 16 optimizes the Meitheal web app's Astro architecture and UX. Focus on reducing duplication, extracting components, removing dead integrations, and polishing user experience. No new features — only optimization of existing code.

## Implementation Decisions

### Architecture: Component Extraction

- Extract `showToast()` into shared `/lib/toast.ts` (duplicated in 4 pages: tasks, table, settings, index)
- Extract task fetching into shared `/lib/task-api.ts` (duplicated fetch calls in 4 pages)
- Extract filter bar into Astro component `FilterBar.astro` (duplicated in tasks + table)
- Extract task card into component `TaskCard.astro` (used in tasks, possibly kanban)
- Extract board switcher JS into `/lib/board-switcher.ts`

### Architecture: Astro Config Cleanup

- Remove `@astrojs/tailwind` (not used — vanilla CSS in `global.css`)
- Remove `@astrojs/sitemap` (HA add-on, no public URL needed)
- Remove `@astrojs/mdx` if not used (check for .mdx files)
- Evaluate `prerender` for static pages (settings? docs?)

### CSS: Organization

- Split 907-line `global.css` into organized partials (layout, forms, cards, kanban, table)
- Remove unused Tailwind utility classes if any leaked in
- Consolidate duplicate page-level `<style>` blocks

### UX: Polish

- Loading states for API calls (skeleton/spinner before data loads)
- Empty state illustrations (not just text)
- Form validation feedback (inline, not just toast)
- Consistent hover/focus states across all interactive elements
- Mobile responsive breakpoints (currently fixed desktop layout)

### UX: Accessibility

- Focus management on modal open/close
- Skip-to-content link
- Keyboard trap prevention in modals
- High-contrast mode support

### Performance

- Lazy load non-critical JS (Astro `client:idle` / `client:visible`)
- Optimize SSR queries (only fetch what's needed per page)
- Add cache headers to API responses where appropriate

## Deferred Ideas

- None — this phase is optimization-only

---

*Phase: 16-astro-optimizations-ux*
*Context gathered: 2026-02-28*
