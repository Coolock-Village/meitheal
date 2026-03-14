# Feature Landscape — List View Overhaul

**Domain:** Task management list/table views
**Researched:** 2026-03-14

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Status |
|---------|--------------|------------|--------|
| Group by status | Every competitor (Linear/ClickUp/Asana) | Low | ❌ Missing |
| Group by priority | Teamhood/Linear/ClickUp | Low | ❌ Missing |
| Group by type (epic/story/task) | Teamhood rows, kanban swimlanes | Low | ❌ Missing |
| Group by board | Teamhood/ClickUp project grouping | Low | ❌ Missing |
| Group by assignee | Linear/ClickUp/Jira/Asana | Low | ❌ Missing |
| Collapsible groups | All competitors | Low | ❌ Missing |
| Group counts (badge) | Teamhood/Linear/ClickUp | Low | ❌ Missing |
| Board filter in list | Kanban has it, table doesn't | Low | ❌ Missing |
| Type filter in list | Kanban has it, table doesn't | Low | ❌ Missing |
| User filter pills | Kanban has it, table has dropdown | Low | ❌ Missing |
| Clear all filters | Linear/ClickUp/Teamhood | Low | ✅ Exists |
| Text search | All competitors | Low | ✅ Exists |
| Status filter | All competitors | Low | ✅ Exists |
| Priority filter | All competitors | Low | ✅ Exists |
| Label filter | All competitors | Low | ✅ Exists |
| Column sorting | All competitors | Low | ✅ Exists |
| Bulk actions | Linear/ClickUp | Medium | ✅ Exists |
| Inline editing | Linear/ClickUp | Medium | ✅ Exists |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Status |
|---------|-------------------|------------|--------|
| Saved filter/view presets | Personalization, quick access | Medium | 🔧 API exists, no UI |
| RICE score grouping | Unique to Meitheal | Low | ❌ Missing |
| AND/OR filter logic | Linear-level filtering | High | ❌ Missing |
| Column customization (show/hide) | Teamhood/ClickUp parity | Medium | ❌ Missing |
| Shared filter state across views | Seamless Kanban↔Table switching | Medium | 🔧 Partial (localStorage) |
| Sub-grouping (nested groups) | Linear has this | High | ❌ Missing |
| Color-coded group headers | Teamhood visual clarity | Low | ❌ Missing |
| Grand total / summary row | Teamhood baseline feature | Low | ❌ Missing |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Gantt in list view | Already have separate Gantt page | Link to Gantt from table |
| Drag-to-reorder in table | Complex, low ROI for table | Keep in kanban only |
| Pivot table mode | Over-engineering, enterprise bloat | Group-by covers 90% of use cases |
| Timeline columns | Complexity explosion | Use dedicated timeline/calendar views |

## Feature Dependencies

```
Board Filter → Group by Board (board filter needed to test grouping)
Type Filter → Group by Type (type filter needed for swimlane consistency)
Shared FilterToolbar → All grouping features (groups need to respect active filters)
Fix Kanban Filter Bugs → Shared FilterToolbar (can't share broken logic)
```

## MVP Recommendation

Prioritize:
1. **Group by type/priority/board/assignee** — immediate Teamhood parity
2. **Shared filter toolbar** — unifies kanban/table, reduces code duplication
3. **Saved view presets** — differentiator, API already exists

Include (no deferrals):
4. **AND/OR filter logic** — Linear-level compound filtering (P3)
5. **Column customization** — show/hide/reorder per Teamhood (P4)
6. **Sub-grouping** — nested groups (e.g., Board → Type) (P4)
7. **Color-coded group headers** — visual clarity per Teamhood (P5)
8. **Grand total / summary row** — per-group subtotals + grand total (P5)
9. **RICE score grouping** — Meitheal differentiator (P5)
