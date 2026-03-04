# ADHD/Productivity Panel — Phase 57: UI/UX + HA Optimization

**Phase:** 57 — UI/UX Polish Wave + HA Deep Integration
**Iteration:** 01
**Date:** 2026-03-04

---

## 1. Workflow Coach

**Recommendation:** Add Astro `<ViewTransitions>` page-level loading indicators for ingress context.

- Page transitions behind HA ingress are visually choppy — no feedback during navigation
- Astro's built-in loading bar (`<ViewTransitions fallback="swap">`) is disabled behind ingress
- Instead: add a minimal CSS-only loading spinner that shows on `astro:before-swap` and hides on `astro:after-swap`
- Uses `document.startViewTransition` API with fallback — no external deps
- ADHD benefit: reduces perceived latency and "did it work?" anxiety

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 2 | 2 | **Accept** — reduces cognitive load during page transitions |

---

## 2. Execution Coach

**Recommendation:** Add keyboard shortcuts for frequent actions: `n` for New Task, `/` for Search, `k` for Kanban.

- Current workflow requires mouse for everything — Quick Add button, search icon, nav links
- Power users (especially ADHD) benefit from muscle memory shortcuts
- Implement via single `keydown` listener in `Layout.astro` — check `e.target.tagName` to avoid input conflicts
- Map: `n` → `meitheal:new-task` event, `/` → focus search, `1-5` → nav pages
- Display shortcut hints in tooltips on nav links

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 4 | 2 | 1 | **Accept** — high impact for keyboard-driven ADHD workflows |

---

## 3. Knowledge Coach

**Recommendation:** Add contextual help tooltips to dashboard stat cards showing what each metric means.

- Stat cards show numbers ("Total", "Due Today", "Overdue") but no explanation of scope
- New users don't know if "Total" means all-time or current board, or what "Overdue" threshold is
- Add `title` attribute or hover tooltip with 1-line explanation
- E.g. "Tasks past their due date across all boards" for Overdue
- KCS: knowledge embedded at point of use

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 1 | 1 | **Accept** — trivial effort, reduces confusion |

---

## 4. Focus Optimizer

**Recommendation:** Add Astro `prefetch` for sidebar navigation links to eliminate perceived latency.

- Astro supports `data-astro-prefetch` attribute on links — preloads page on hover/tap
- Sidebar nav links are the primary navigation surface — prefetching them eliminates FOUC
- Already have `@astrojs/prefetch` in the stack (via ViewTransitions)
- Just add `data-astro-prefetch="hover"` to `.nav-link` elements
- Near-zero effort, significant UX improvement

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 4 | 1 | 1 | **Accept** — near-zero effort, big UX gain |

---

## 5. Automation Coach

**Recommendation:** Auto-persist sidebar collapsed state via `localStorage` so it survives page navigation.

- Sidebar collapse toggle exists but resets on every page load
- Users who prefer collapsed sidebar have to re-collapse every navigation
- Store `sidebar-collapsed` in `localStorage` on toggle
- Read on page load in `Layout.astro` and apply `body.sidebar-collapsed` class before paint
- Prevents layout shift (FOUC) by reading before first render

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 4 | 1 | 1 | **Accept** — captures user preference, reduces friction |

---

## Summary

| # | Persona | Recommendation | Decision |
|---|---------|----------------|----------|
| 1 | Workflow Coach | Ingress-safe loading indicator | **Accept** |
| 2 | Execution Coach | Keyboard shortcuts (n, /, k) | **Accept** |
| 3 | Knowledge Coach | Stat card help tooltips | **Accept** |
| 4 | Focus Optimizer | Astro prefetch on nav links | **Accept** |
| 5 | Automation Coach | Persist sidebar collapsed state | **Accept** |
