# 20-04: Accessibility & Cross-Browser Polish — Summary

Completed the final deep-polish phase for Phase 20, focusing on accessibility, focus traps, and correct ARIA semantics.

## Files Modified

1. `apps/web/src/pages/kanban.astro`
2. `apps/web/src/layouts/Layout.astro` (verified)
3. `apps/web/src/domains/offline/export-service.ts` (fixed TS check errors from previous phases)

## Key Improvements

- **Focus Traps**: Verified that `Layout.astro` properly traps `Tab` and `Shift+Tab` cycles inside the Command Palette, task detail sliding overlay, and keyboard shortcut modal. Overlays correctly close in priority order when `Escape` is pressed.
- **ARIA Semantics**:
  - Added `role="region"` and `aria-label` to kanban swimlane columns to define clear dropzones for screen readers.
  - Added `role="button"` and `tabindex="0"` to draggable kanban cards so they are keyboard focusable.
  - Removed deprecated `aria-grabbed` attribute following Astro/TS strict mode warnings, relying on native HTML5 `draggable="true"` semantics instead.
- **Typescript Checks**: Remapped the CSV export schema in `export-service.ts` to strictly adhere to the `OfflineTask` interface, stripping unsupported decorator fields (`taskType`, `priority`) to ensure a flawless `pnpm check` build.

## Self-Check: PASS

- `pnpm check` succeeds with zero errors across the repo.
- Modals successfully trap focus.
- Kanban columns announce as regions.
