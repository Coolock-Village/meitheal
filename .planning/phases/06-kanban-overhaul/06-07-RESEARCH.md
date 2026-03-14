# Phase 6 Plan 07: Unified Filter Pipeline & Swimlane Fixes — Research

**Researched:** 2026-03-14
**Domain:** Kanban filtering, swimlane grouping, cross-filter consistency
**Confidence:** HIGH

## Summary

The Kanban board has **4 independent filter dimensions** (type, user, board, label) that operate in silos. Each uses different visibility mechanisms, creating 6 bugs when filters interact with swimlane grouping.

## Architecture: Current State (BROKEN)

### Filter Mechanisms (Inconsistent)

| Filter | Visibility Mechanism | Updates Column Count? | Updates Swimlane Count? |
|--------|---------------------|----------------------|------------------------|
| Type | `style.display = "none"` on `.flat-card` | ✅ via `updateColumnCounts()` | ❌ NO |
| Board | `style.display = "none"` on `.kanban-card` | ✅ via `updateColumnCounts()` | ❌ NO |
| Label | `style.display = "none"` on `.flat-card` only | ✅ via `updateColumnCounts()` | ❌ NO |
| User | `.user-filtered-out` CSS class | ✅ via duplicated inline count logic | ❌ NO |

### Bugs

1. **`updateColumnCounts()` (line 1546)** checks `.kanban-card:not([style*="display: none"])` — misses `.user-filtered-out` cards
2. **User filter (line 1934)** duplicates count logic with `.kanban-card:not([style*="display: none"]):not(.user-filtered-out)` — but only runs after user filter changes, not after type/label/board filter changes
3. **Swimlane count (line 1698, 1758)** counts ALL `.kanban-card` children — ignores all 4 filter dimensions
4. **Label filter (line 1516)** only targets `.flat-card` — doesn't work when cards are in swimlane groups (`.grouped-card`)
5. **Dynamic swimlane collapse (line 1766-1768)** uses `style.display = "none"` instead of CSS class, breaking count selectors
6. **Board filter + swimlane interaction** — board filter hides cards, but swimlane counts still show total pre-filter count

### Root Cause

No unified `isCardVisible()` function. Each filter/count function reinvents visibility logic. No central `updateAllCounts()` that accounts for all 4 filter dimensions simultaneously.

## Fix: Unified Visibility Helper

```javascript
function isCardVisible(card) {
  if (card.style.display === "none") return false
  if (card.classList.contains("user-filtered-out")) return false
  return true
}

function updateAllCounts() {
  // Column header counts
  document.querySelectorAll(".kanban-column").forEach(col => {
    const count = col.querySelector(".kanban-count")
    const visible = Array.from(col.querySelectorAll(".kanban-card")).filter(isCardVisible)
    if (count) count.textContent = visible.length
  })
  // Swimlane counts
  document.querySelectorAll(".swimlane-group").forEach(group => {
    const countEl = group.querySelector(".swimlane-count")
    const visible = Array.from(group.querySelectorAll(".kanban-card")).filter(isCardVisible)
    if (countEl) countEl.textContent = visible.length
  })
}
```

## Additional Fixes

### Dynamic Swimlane Collapse → CSS Class
Replace `cardsEl.style.display = "none"` with `group.classList.toggle("collapsed")`, matching Plan 04's static swimlane approach. Use localStorage key scoped by swimlane type+value.

### Label Filter → All Cards (not just .flat-card)
Change `.flat-card` selector to `.kanban-card` in `applyLabelFilter()`, so it works in both flat and grouped modes.

### Board Filter → Trigger `updateAllCounts()`
Board filter change handler already calls `updateColumnCounts()`. Replace with `updateAllCounts()`.

### User Filter → Use `updateAllCounts()`
Delete duplicated inline count logic in user filter handler. Call `updateAllCounts()` instead.
