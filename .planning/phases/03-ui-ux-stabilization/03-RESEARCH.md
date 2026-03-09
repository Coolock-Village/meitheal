# Phase 3: UI/UX Stabilization - Research

**Researched:** 2026-03-09
**Domain:** Astro SSR layout, CSS scroll contexts, HA ingress iframe, theme management
**Confidence:** HIGH

## Summary

The UI/UX regression has three independent root causes, all verified through codebase analysis and framework documentation:

1. **Scroll blocking**: `.main-content` creates a nested scroll context with `height: 100vh` + `overflow-y: auto`. Mouse wheel events target `body/html` but the scrollable element is `.main-content`. Fix: remove `height: 100vh`, let body handle natural scrolling.

2. **Click/interaction failures**: Task detail panel sets `body.style.overflow = 'hidden'` on open but only resets on `pagehide` event — not on Escape key or click-outside close. Body stays locked until page navigation.

3. **Theme inconsistency**: Dark theme relies on `:root` fallthrough (no explicit `data-theme="dark"` attribute). When HA theme passthrough runs, it can't distinguish "no explicit theme" from "dark theme". Light theme has correct `[data-theme="light"]` selector.

**Primary recommendation:** Fix the three root causes first (P0), then proceed to P1-P2 improvements. All fixes are CSS/JS-only — no API or DB changes needed.

## Standard Stack

### Core (Already In Use)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Astro | 5.x SSR | Framework | ✅ In use |
| pageLifecycle | internal | ViewTransition-safe event cleanup | ✅ Correct pattern |
| AbortController signals | native | Event listener cleanup | ✅ Correct pattern |

### Supporting (No New Dependencies Needed)
All fixes use existing CSS custom properties and vanilla JS patterns. No new libraries required.

## Architecture Patterns

### Pattern 1: Astro View Transition Lifecycle (from Context7)

**What:** `astro:page-load` replaces `DOMContentLoaded` when view transitions are enabled. `astro:after-swap` is the hook for scroll position control.

**Key insight for Meitheal:** The existing `pageLifecycle.onPageLoad` wrapper already handles this correctly. The issue is NOT with event rebinding — it's with the CSS scroll context.

```javascript
// Correct pattern (already in use in layout-controller.ts)
document.addEventListener("astro:page-load", () => {
  // Re-initialize handlers here
});

// Scroll restoration after swap (use for manual control)
document.addEventListener("astro:after-swap", () =>
  window.scrollTo({ left: 0, top: 0, behavior: "instant" }),
);
```

### Pattern 2: HA Ingress Iframe Isolation (from HA Developer Docs)

**What:** HA add-ons with `ingress: true` render in an iframe. The iframe gets the full viewport minus HA's own sidebar/header.

**Key insight for Meitheal:** `height: 100vh` inside an iframe refers to the iframe's viewport, NOT the HA page viewport. This is correct behavior but creates problems if there's ALSO a parent scroll context (body/html with flex layout).

### Anti-Patterns to Avoid

- **`height: 100vh` + `overflow-y: auto` on a non-root element**: Creates nested scroll context — mouse wheel targets wrong element
- **Setting `body.style.overflow` without cleanup**: Must always reset on ALL close paths, not just `pagehide`
- **Relying on `:root` fallthrough for dark theme**: All themes should set explicit `data-theme` attribute
- **Duplicate module registration**: SW registered in both inline script and module import

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Touch drag on mobile | Custom touch-to-HTML5-drag bridge | `@formkit/drag-and-drop` or SortableJS | Edge cases with scroll vs drag, iOS momentum scrolling |
| Focus trap in modals | Manual focusable-elements query | Existing `createFocusTrap` from `@lib/focus-trap` | Already in codebase, just needs consistent usage |
| Theme detection | Manual media query matching | CSS `[data-theme]` attribute + `prefers-color-scheme` media query | Already structured correctly in `_tokens.css` |

## Common Pitfalls

### Pitfall 1: Nested Scroll Contexts
**What goes wrong:** Parent element has overflow scroll, child also has overflow scroll. Wheel events go to the wrong one depending on pointer position.
**Why it happens:** `height: 100vh` and `overflow-y: auto` seem logical but create a second scrollbar context.
**How to avoid:** Only ONE element should own scroll. Either body scrolls (natural) or a single app-shell container scrolls. Never both.
**Warning signs:** "Scroll doesn't work" reports from users.

### Pitfall 2: Body Overflow Lock Without Cleanup
**What goes wrong:** Modal/overlay sets `body.style.overflow = 'hidden'` to prevent background scroll. If overlay is closed by any method other than the one that resets it, scroll stays locked.
**Why it happens:** Multiple close paths (Escape, click outside, close button, navigation) but only one remembered to reset.
**How to avoid:** Centralize overlay state management — single `closeOverlay()` function that always resets body overflow AND removes panel AND dispatches cleanup events.

### Pitfall 3: Implicit Theme State
**What goes wrong:** Dark theme "works" because `:root` has dark values. But components targeting `[data-theme="dark"]` get nothing.
**Why it happens:** Initial theme code only sets `data-theme` for light/auto/custom, assumes dark is the "no attribute" default.
**How to avoid:** Always set `data-theme` attribute explicitly for all theme states.

## Code Examples

### Fix 1: Scroll Context (CSS)
```css
/* Before (broken) */
.main-content {
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
}

/* After (fixed) */
.main-content {
    min-height: 100vh;
    overflow-x: hidden;
    /* No overflow-y — body handles scroll naturally */
}
```

### Fix 2: Body Overflow Cleanup (JS)
```typescript
// Centralized overlay close function
function closeTaskDetail() {
  const overlay = document.getElementById("task-detail-overlay")
  if (overlay) {
    overlay.classList.add("hidden")
  }
  // ALWAYS reset body overflow
  document.body.style.overflow = ""
}
```

### Fix 3: Theme Initialization (JS)
```javascript
// Before (bug — dark has no attribute)
const theme = localStorage.getItem("meitheal-theme") || "dark"
if (theme === "light") document.documentElement.dataset.theme = "light"
else if (theme === "auto") document.documentElement.dataset.theme = "auto"

// After (fixed — all themes explicit)
const theme = localStorage.getItem("meitheal-theme") || "dark"
document.documentElement.dataset.theme = theme
```

## Open Questions

1. **Touch drag library choice**: SortableJS vs @formkit/drag-and-drop for mobile kanban drag. Deferred to P3 — not blocking the P0 scroll/click fixes.
2. **HA iframe height**: Does HA set the iframe height explicitly or use flexbox? Needs Tier 2 verification.

## Sources

### Primary (HIGH confidence)
- Context7 `/withastro/docs` — View transitions lifecycle, scroll restoration, `astro:page-load` replacement for DOMContentLoaded
- Context7 `/home-assistant/developers.home-assistant` — Ingress iframe isolation, custom panel CSS patterns

### Secondary (MEDIUM confidence)
- Codebase analysis — `_layout.css`, `_base.css`, `_tokens.css`, `Layout.astro`, `layout-controller.ts`
- 50-persona audit findings — verified against code

## Metadata

**Confidence breakdown:**
- Scroll fix: HIGH — root cause verified in CSS, fix is standard pattern
- Body overflow fix: HIGH — code paths traced, single missing cleanup call
- Theme fix: HIGH — attribute not set, verified in Layout.astro init script
- Touch drag: LOW — needs library evaluation (deferred)

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain — CSS/JS patterns don't change fast)
