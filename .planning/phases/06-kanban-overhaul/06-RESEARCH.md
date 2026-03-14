# Phase 6: Kanban Board UI/UX Overhaul - Research

**Researched:** 2026-03-14
**Domain:** Kanban board UX, CSS scroll constraints, user avatar patterns, board filtering, competitive parity with Teamhood
**Confidence:** HIGH

## Summary

The Kanban board (`kanban.astro`, 2629 lines) has 5 confirmed P0-P1 bugs and significant UX gaps compared to competitors like Teamhood, Jira, and Linear. Root causes are traced to specific lines in the codebase.

The core issues fall into three categories:

1. **Visual bugs**: User filter pills render full display names instead of initials-only avatars, and group-by-board swimlane headers show raw `board_id` strings (e.g., "default67") instead of resolved board titles. Both are simple data presentation bugs.

2. **Layout/scroll failures**: Kanban columns have no vertical scroll constraint — `.kanban-cards` uses `flex-1` without `max-height` or `overflow-y`, so columns grow infinitely past the viewport fold. Additionally, `board.setAttribute("tabindex", "0")` on the entire `.kanban-board` element makes it focusable/draggable, causing ghost image artifacts when users click empty space.

3. **Feature integration gap**: Board filtering lives only in the sidebar (`SidebarBoardSwitcher.astro`) and disconnected from the Kanban toolbar. It applies `display:none` to cards but doesn't update swimlane group counts, creating a confusing split experience.

**Primary recommendation:** Fix all 5 bugs with targeted edits to `kanban.astro` and `_kanban.css`. No new dependencies, no architectural changes. Inline board filter can sync via `CustomEvent` between sidebar and Kanban toolbar.

## Standard Stack

### Core (Already In Use)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Astro | 5.x SSR | Framework - page rendering | ✅ In use |
| HTML5 Drag & Drop | native | Card drag between columns | ✅ In use |
| Touch Drag Polyfill | inline | Long-press drag on mobile | ✅ In use (kanban.astro:1867-1958) |

### Supporting (No New Dependencies Needed)
All fixes use existing CSS properties and vanilla JS. No new libraries required.

| Pattern | Purpose | Where Used |
|---------|---------|-----------|
| `CustomEvent` dispatch | Cross-component communication | Already used for board switching in `SidebarBoardSwitcher.astro` |
| `fetch('/api/boards')` | Board title resolution | Already called by sidebar, will reuse in groupBy handler |
| CSS `max-height` + `overflow-y` | Column scroll containment | Standard CSS, no framework needed |

## Architecture Patterns

### Pattern 1: Initials-Only Avatar Pills
**What:** User filter pills show a 2-letter initials circle with full name on `title` tooltip hover.
**When:** Every modern Kanban tool (Jira, Linear, Teamhood, Asana, Monday.com) uses this pattern.
**Why:** Saves horizontal space, scales to 5+ team members, reduces visual noise.

**Current code (broken):**
```javascript
// kanban.astro:1798-1800
const label = document.createElement("span");
label.textContent = u.display_name || u.name || u.id;
btn.appendChild(label);
```

**Fix:** Remove the `<span>` label. The `btn.title` already has the full name for hover tooltip. The initials avatar (`btn > span.avatar`) is sufficient.

### Pattern 2: Board Title Resolution in Group-By
**What:** When grouping by board, fetch board titles from `/api/boards` and use a lookup map instead of raw `board_id`.
**When:** The `groupBySelect` change handler fires with `mode === "board"`.

**Current code (broken):**
```javascript
// kanban.astro:1672-1673
const label = icons[key] || (mode === "board" ? `📋 ${key}` : defaultLabel);
```

**Fix:** Make the handler `async`, fetch boards once when mode is "board", build `boardTitleMap`, use it for label resolution with fallback to raw key.

### Pattern 3: Column Scroll Constraint
**What:** Kanban columns must have a `max-height` based on viewport, with `overflow-y: auto` for scrolling.
**When:** Standard in every production Kanban (Trello, Jira, Teamhood).

**Current CSS (broken):**
```css
/* _kanban.css - .kanban-column has no max-height */
.kanban-column { flex-col; }
/* .kanban-cards has flex-1 but no overflow-y */
```

**Fix:** Add `max-height: calc(100vh - 200px)` to `.kanban-board`, `max-height: 100%` to `.kanban-column`, `flex-shrink: 0` to `.kanban-column-header`, and `overflow-y: auto` to `.kanban-cards`.

### Anti-Patterns to Avoid
- **`tabindex="0"` on container elements**: Makes the entire board focusable and creates drag ghost artifacts
- **Full name text labels on avatar buttons**: Doesn't scale, breaks toolbar layout
- **Raw database IDs in UI**: Always resolve to human-readable labels

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Board title resolution | Inline string replacement | Fetch from `/api/boards` + lookup map | Board titles can change, must be dynamic |
| Cross-component filter sync | Custom pub/sub | `CustomEvent` dispatch on `document` | Already the pattern used by sidebar board switcher |
| Column scroll | Custom virtual scroll | CSS `max-height` + `overflow-y: auto` | Native CSS handles thousands of cards efficiently |

## Common Pitfalls

### Pitfall 1: Board Filter Double-Fetch
**What goes wrong:** Both sidebar and toolbar fetch `/api/boards` independently.
**Why it happens:** No shared board state.
**How to avoid:** Cache boards in `window.__boardCache` after first fetch. Both components read from cache.
**Warning signs:** Extra network requests visible in DevTools.

### Pitfall 2: Async GroupBy Handler Race Condition
**What goes wrong:** User changes group-by dropdown rapidly, previous async fetch completes after newer one.
**Why it happens:** No abort controller or version tracking on the async handler.
**How to avoid:** Use a simple counter — only apply results if counter matches the request that started.
**Warning signs:** Swimlane headers show wrong board names briefly.

### Pitfall 3: Column Scroll + Drag-and-Drop Conflict
**What goes wrong:** Scrolling inside a column can accidentally start a card drag.
**Why it happens:** Drag and scroll both respond to pointer events.
**How to avoid:** Drag should only activate on the card's drag handle (`.kanban-card[draggable="true"]`), not the scroll container. This is already correct in the current implementation.

## Code Examples

### Fix 1: Remove User Filter Full Names
```javascript
// Remove lines 1798-1800 in kanban.astro
// Before:
btn.appendChild(avatar);
const label = document.createElement("span");
label.textContent = u.display_name || u.name || u.id;
btn.appendChild(label);

// After:
btn.appendChild(avatar);
// Initials avatar + title tooltip is sufficient
```

### Fix 2: Remove Board Tabindex
```javascript
// Remove line 1404 in kanban.astro
// Before:
board.setAttribute("tabindex", "0");

// After:
// (removed — keyboard nav via individual card focus)
```

### Fix 3: Resolve Board Titles
```javascript
// In groupBySelect change handler, make async and add board lookup
groupBySelect?.addEventListener("change", async () => {
  const mode = groupBySelect.value;
  let boardTitleMap = {};
  if (mode === "board") {
    try {
      const res = await fetch((window.__ingress_path || "") + "/api/boards");
      if (res.ok) {
        const data = await res.json();
        (data.boards || []).forEach(b => {
          boardTitleMap[b.id] = `${b.icon || '📋'} ${b.title}`;
        });
      }
    } catch { /* fallback to raw IDs */ }
    boardTitleMap["default"] = "📋 Default";
  }
  // ... rest of handler uses boardTitleMap[key] for label
});
```

### Fix 4: Column Scroll CSS
```css
.kanban-board {
  max-height: calc(100vh - 200px);
}
.kanban-column {
  max-height: 100%;
}
.kanban-column-header {
  flex-shrink: 0;
}
.kanban-cards {
  overflow-y: auto;
  flex: 1;
  min-height: 0; /* allow flex child to shrink below content */
}
```

## Competitive Analysis: Teamhood

Analyzed via browser (https://onlyme.teamhood.com/RSWO/Board/MARS?view=KANBAN):

| Feature | Teamhood | Meitheal (Current) | Gap |
|---------|----------|-------------------|-----|
| Avatars | Initials circle, no name text | Full name + initials | Fix: Remove name text |
| Column scroll | Smooth scroll, contained height | No scroll, infinite growth | Fix: CSS constraint |
| Board drag | No accidental board movement | Board moves when clicking empty space | Fix: Remove tabindex |
| Group headers | Resolved names with icons | Raw database IDs | Fix: Fetch and resolve |
| Board filter | Inline toolbar dropdown | Sidebar only, disconnected | Fix: Add toolbar filter |
| Card density | Compact, ~3-4 lines per card | Similar density | Parity ✅ |
| Column width | Fixed ~280px | Fixed 260-300px | Parity ✅ |
| Drag feedback | Smooth cursor + ghost | HTML5 ghost with touch polyfill | Acceptable ✅ |

## Open Questions

1. **Board filter toolbar vs sidebar**: Should the toolbar filter replace or supplement the sidebar filter? Recommendation: supplement — sync both via `CustomEvent`.
2. **Swimlane count update on filter**: When board filter is active, should swimlane counts reflect filtered or total count? Recommendation: filtered count.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `kanban.astro` (full file, 2629 lines), `_kanban.css`, `SidebarBoardSwitcher.astro`, `board-repository.ts`
- Browser competitive analysis: Teamhood Kanban board (live screenshots captured)
- 50-persona audit: UX findings from planning session

### Secondary (MEDIUM confidence)
- Phase 03 RESEARCH.md: Patterns for CSS scroll contexts, HA ingress iframe isolation
- CONCERNS.md: Documented Kanban bugs and priorities

## Metadata

**Confidence breakdown:**
- User filter pills: HIGH — exact line numbers, simple removal
- Board tabindex: HIGH — single line removal, root cause confirmed
- Board title resolution: HIGH — API endpoint exists, simple lookup
- Column scroll: HIGH — standard CSS pattern, verified in Phase 03 research
- Board filter integration: MEDIUM — sync pattern needs testing in HA ingress

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain — CSS/JS/UX patterns)
