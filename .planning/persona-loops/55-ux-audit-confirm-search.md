# Persona Audit Iterations 37-46 — Confirm Dialog, Search, Command Palette

**Date:** 2026-03-01
**Scope:** Replace all native browser dialogs, fix search result interaction

## Findings

### Confirm Dialog Replacement (1-8)
| # | File | Usage | Variant |
|---|------|-------|---------|
| 1 | Layout.astro | Attachment delete | danger |
| 2 | Layout.astro | Task delete | danger |
| 3 | settings.astro | Purge all tasks | danger |
| 4 | settings.astro | 2nd confirm (removed, merged into single modal) | danger |
| 5 | settings.astro | Reset settings | warning |
| 6 | table.astro | Row delete | danger |
| 7 | table.astro | Bulk delete (N tasks) | danger |
| 8 | kanban.astro | Lane delete | warning |

### Search + UX (9-10)
| # | Finding | Fix |
|---|---------|-----|
| 9 | Search results not clickable | Added click handler → openTaskDetail |
| 10 | confirmDialog not available in inline scripts | Exposed on `window` from Layout.astro |

## New File
- **`lib/confirm-dialog.ts`** — Drop-in replacement for `confirm()`:
  - 3 variants: `danger`, `warning`, `default`
  - Keyboard: Escape cancels, Enter confirms
  - ARIA: `alertdialog`, `aria-modal`, `aria-labelledby`
  - Animations: fade-in, slide-in (respects prefers-reduced-motion)
  - Icon per variant: 🗑️ danger, ⚠️ warning, ❓ default

## Verification
| Check | Result |
|-------|--------|
| `astro build` | ✅ 0 errors |
| All 8 confirm() calls replaced | ✅ grep confirms 0 remaining native confirm() |
