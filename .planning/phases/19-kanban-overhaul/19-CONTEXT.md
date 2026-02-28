# Phase 19: Kanban Board Overhaul — Context

## Objective

Complete overhaul of `kanban.astro` to reach production-grade Kanban board quality comparable to Trello, Linear, and Vikunja. Current implementation is functional but visually and interactionally amateur.

## Current State (audited 2026-02-28)

Source: `apps/web/src/pages/kanban.astro` (759 lines)
URL: `http://localhost:4323/kanban`

### What Works

- Drag-and-drop between columns (HTML5 native drag API)
- Status columns (Pending/Active/Complete) with task counts
- Priority color border-left indicator
- RICE score display on cards
- View switcher (List/Kanban/Table)
- Custom swimlanes (data model exists)
- Duplicate task action
- AI action button (opens ChatGPT)

### Critical Problems

1. **Mobile Unusable** — columns stay side-by-side, don't stack, horizontal overflow
2. **Edit Redirects Away** — clicking edit navigates to `/tasks#edit-{id}` instead of opening task detail panel inline
3. **Search Doesn't Filter** — search bar shows dropdown results but doesn't filter Kanban cards
4. **Lanes Button Dead** — `⚙ Lanes` button click produces no UI response
5. **Test Data Column** — 4th column labeled `📌 nm,m,n` is test garbage
6. **Add Task Button Inconsistent** — 3 columns have faint dashed `+ Add Task`, 4th column has bold different style
7. **Board Selector is Stock HTML** — `<select>` at sidebar bottom looks unpolished vs dark theme
8. **No Card Hover State** — cards feel static, no elevation/shadow change on hover
9. **Cards Are Bare-Minimum** — title + priority dot only, no due-date display on most cards
10. **Description Unstyled** — raw text dump under title, no visual separation
11. **Page Reload on Drop** — `setTimeout(() => window.location.reload(), 300)` is brutal UX
12. **No Visual Drag Feedback** — no ghost card, no drop zone highlights during drag
13. **Complete Column Emoji Breaks Layout** — ✅ wraps above text at narrow widths

## Constraints

- **Perf budget:** 81700/81920 bytes (220B headroom) — cannot add client JS
- **Astro-first:** SSR, no React/Vue — `is:inline` scripts only
- **DDD:** Tasks domain boundaries must be respected
- **KCS:** Document decisions in same commit

## Benchmark Competitors

- Trello: drag ghost, card covers, checklist progress, labels as color bars
- Linear: minimal cards, keyboard navigation, cmd+K search, instant updates
- Vikunja: column WIP limits, card assignees, due date badges, card covers
- Super Productivity: time tracking on cards, sub-task progress bars
