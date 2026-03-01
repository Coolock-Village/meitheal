# Persona Audit Iterations 2-6 — Phase 31 UX & Quality Sweep

**Date:** 2026-03-01
**Scope:** API hardening, visual polish, keyboard shortcuts, recurrence engine, NL date parser

## Iteration 2: Error Handling & Data Integrity

| # | Finding | Fix |
| --- | --- | --- |
| 1 | JSON parse crashes APIs on malformed body | 400 response with "Invalid JSON body" |
| 2 | Filter/template names unbounded | Max 100 chars validation |
| 3 | Snooze hardcoded to 1 hour | Configurable: 15/30/60/240/1440 min |
| 4 | Reminder action not validated | Must be 'dismiss' or 'snooze' |
| 5 | 500 errors not logged | Structured `console.error` with context |
| 6 | template_id passed as generic object | Cast to `String()` for type safety |

## Iteration 3: Visual Polish

| # | Finding | Fix |
| --- | --- | --- |
| 1 | Cards appear instantly (no entrance feel) | Staggered `card-enter` animation (0.25s, nth-child delays) |
| 2 | Checklists have no styling | `.checklist-item` with toggle + strike-through |
| 3 | Quick-add input no focus indicator | Focus glow ring (accent 3px) |
| 4 | Calendar today not prominent enough | Pulsing accent ring animation (2s infinite) |
| 5 | Progress bars all same color | Threshold classes: low (red) / mid (amber) / high (green) |
| 6 | Task completion no animation | Strike-through animation (0.3s ease-out) |

## Iteration 4: Keyboard Shortcuts

| # | Finding | Fix |
| --- | --- | --- |
| 1 | No shortcut for Today | `y` → /today |
| 2 | No shortcut for Upcoming | `u` → /upcoming |
| 3 | No shortcut for Calendar | `c` → /calendar |
| 4 | New shortcuts not in help modal | Added i18n keys: `shortcut_today/upcoming/calendar` (en + ga) |

## Iteration 5: Recurrence Engine

| # | Finding | Fix |
| --- | --- | --- |
| 1 | Jan 31 monthly → Feb 31 (invalid date) | Clamp to last day of target month |

## Iteration 6: NL Date Parser

| # | Finding | Fix |
| --- | --- | --- |
| 1 | Full audit of all patterns | No changes needed — all 8 patterns robust |

## Verification

| Check | Result |
| --- | --- |
| `astro build` | ✅ 0 errors |
| `pnpm test` | ✅ 117 passed, 0 regressions |
