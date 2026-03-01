# 51-Persona UX Audit — Phase 31 Core Feature Parity

**Date:** 2026-03-01
**Scope:** Today/Upcoming/Calendar pages, checklists, recurrence, reminders

## Audit Matrix

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 1 | UX Designer | Today page | Empty state "Due Today (0)" takes excessive space; shows "(0)" count unnecessarily | ⚠️ Med | ✅ Fixed: compact empty state, header hides count when 0 |
| 2 | i18n Engineer | Sidebar | New nav links (Today/Upcoming/Calendar) hardcoded in English alongside localized items | ⚠️ Med | ✅ Fixed: added `nav.today/upcoming/calendar` to both `en.json` and `ga.json` |
| 3 | Information Architect | Upcoming | Each empty day gets a full card with "Nothing scheduled" — wastes vertical space | ⚠️ Med | ✅ Fixed: empty days collapse to single-line with opacity fade |
| 4 | Visual Designer | Calendar | No weekend differentiation; all 7 columns look identical | ⚠️ Med | ✅ Fixed: `.cal-weekend` class, today circle highlight |
| 5 | Interaction Designer | All pages | Task items have no hover/focus indication | ⚠️ Med | ✅ Fixed: hover `bg-hover`, `focus-visible` outline, `transition` on all items |
| 6 | Mobile UX | Calendar | Calendar cells too tall on small screens | ℹ️ Low | ✅ Fixed: `@media (max-width: 640px)` reduces min-height and font sizes |
| 7 | Accessibility | Today | Checkbox + task icon doubled up; no aria-labels on task items | ⚠️ Med | ✅ Fixed: `role=button`, `tabindex=0`, descriptive aria-labels, keyboard Enter/Space |
| 8 | Content Strategist | Upcoming | "0 tasks" and "Nothing scheduled" shown simultaneously — redundant | ℹ️ Low | ✅ Fixed: empty days show only em-dash, no redundant text |
| 9 | Performance | Upcoming | 7 sequential DB queries (one per day) on server render | ⚠️ Med | ✅ Fixed: single `BETWEEN` query → `Map` bucketing in JS |
| 10 | Product | Today/Upcoming | No quick-add; users must navigate to /tasks to create | ⚠️ Med | ✅ Fixed: inline quick-add form with live NL date feedback |

## Summary

| Severity | Count | Resolved |
|----------|-------|----------|
| ⚠️ Med | 8 | 8 ✅ |
| ℹ️ Low | 2 | 2 ✅ |

**All 10 findings resolved in this audit.**

## Verification

| Check | Result |
|-------|--------|
| `astro build` | ✅ 0 errors |
| `pnpm test` | ✅ 117 passed, 0 regressions |
| Visual (Today) | Quick-add bar, localized sidebar, compact empty state |
| Visual (Upcoming) | Collapsed empty days, accent highlight on today |
| Visual (Calendar) | Weekend columns, today circle, large nav buttons |
