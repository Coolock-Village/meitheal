# Research Summary: List View Overhaul — Swimlanes, Filtering & Kanban Unification

**Domain:** Task management list/table views
**Researched:** 2026-03-14
**Overall confidence:** HIGH

## Executive Summary

Meitheal's table/list view is functionally disconnected from the Kanban board. The Kanban has rich grouping (swimlanes by type/board/priority), 4 filter dimensions (type toggles, user pills, board selector, label chips), and a group-by dropdown. The table view has basic individual filters (search, status, priority, RICE, user, labels) but zero grouping, no board filter, no swimlane concept, and no shared filter infrastructure with Kanban.

Competitors (Teamhood, Linear, ClickUp, Jira, Asana) have standardised that **list views should support the same grouping and filtering dimensions as board views** — just rendered as collapsible row groups instead of columns. This is table stakes, not a differentiator.

The fix has three pillars:
1. **Shared filter infrastructure** — extract filtering into a unified toolbar component with identical dimensions across views
2. **Row grouping / swimlanes** — collapsible grouped sections in the table, matching Kanban's group-by modes
3. **Saved filter presets** — reusable filter+grouping combos, persisted per-user (already has `/api/saved-filters` endpoint)

## Key Findings

**Stack:** No new dependencies. Pure Astro components + vanilla TS controller refactoring.
**Architecture:** Extract `FilterToolbar.astro` shared component, add `GroupedTableSection` component, unify `filter-state.ts` to support grouping + board dimensions.
**Critical pitfall:** Kanban's filter code is 800+ lines of inline script with 6 known bugs (see Phase 06-07 research). Must fix those bugs first or unifying will import the bugs into the table view.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Unified Filter Infrastructure** — Fix kanban filter bugs (06-07 PLAN), then extract shared `FilterToolbar` component
   - Addresses: Filter parity gap, code duplication, kanban bugs
   - Avoids: Importing broken filter logic into table

2. **Table Row Grouping (Swimlanes)** — Add collapsible row groups to table view matching kanban's group-by modes
   - Addresses: Teamhood row parity, missing grouping, kanban/table disconnect
   - Avoids: Separate grouping implementations that diverge

3. **Advanced Filtering + Saved Presets** — AND/OR filter logic, saved filter presets, column customization
   - Addresses: Linear/ClickUp parity, saved views, personalisation
   - Avoids: Over-engineering before core grouping works

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Competitor features | HIGH | Multiple sources verified against official docs |
| Architecture approach | HIGH | Follows existing Meitheal DDD patterns |
| Grouping implementation | MEDIUM | Needs validation of server-side vs client-side grouping perf |
| Saved presets | HIGH | `/api/saved-filters` endpoint already exists |

## Gaps to Address

- Column customization (show/hide columns) — deferred, design decision needed
- Sub-grouping (Linear supports nested groups) — defer to later phase
- Custom field filters — requires custom fields schema stabilization first
