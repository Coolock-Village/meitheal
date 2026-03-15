# Codebase Concerns

> Last mapped: 2026-03-15 — 50-persona audit

## Critical: Script Monolith

**File:** `apps/web/src/pages/kanban.astro` (3,191 lines)
- ~1,800 lines of inline `<script>` including 280+ lines of quick action handlers
- Defeats Astro's island architecture — all JS loads for every card
- Makes HMR unpredictable, prevents tree-shaking
- **Fix:** Extract to `apps/web/src/lib/kanban-quick-actions.ts`

## Critical: Design Token Violations

**Files:** `apps/web/src/pages/kanban.astro` lines 2746-2754
- Hardcoded hex colors: `#3b82f6`, `#8b5cf6`, `#ec4899`
- Existing system uses `var(--info)`, `var(--success)`, `var(--warning)`
- **Fix:** Add to `_tokens.css` or use existing semantic tokens

## High: Accessibility Gaps

**Files:** `apps/web/src/pages/kanban.astro` lines 1128-1361
- No ARIA roles on popover elements (`role="dialog"`, `role="menu"`)
- No keyboard navigation (arrow keys, focus trap)
- No `aria-hidden="true"` on decorative SVGs
- No focus ring on color swatches
- **Fix:** Full ARIA + keyboard nav pass

## High: Performance — Document Listeners

**Files:** `apps/web/src/pages/kanban.astro`
- Multiple `document.addEventListener("click")` / `("keydown")` for popovers
- Fire on EVERY click/keypress
- **Fix:** Single delegated listener, shared across all popovers

## Medium: UX Gaps

- Child task inherits parent status (should always be "pending")
- No active color indicator on swatches
- No loading skeleton for assign popover
- `window.location.reload()` after child creation (jarring)
- Popover has no exit animation
- **Fix:** Individual UX fixes per audit item

## Medium: Other Monoliths

| File | Lines | Concern |
|------|-------|---------|
| `settings-controller.ts` | 3,202 | Largest file in codebase |
| `task-modal-controller.ts` | 2,348 | Complex modal logic |
| `Layout.astro` | 1,484 | Large layout with inline logic |
| `table-controller.ts` | 1,246 | Growing table logic |
