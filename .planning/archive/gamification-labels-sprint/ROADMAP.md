# Gamification + Labels — Roadmap

**Project:** Meitheal Gamification + Labels Sprint
**Phases:** 5
**Requirements:** 21
**Date:** 2026-03-08
**Status:** ✅ COMPLETE

---

## Progress

| # | Phase | Status | Date |
|---|-------|--------|------|
| 1 | Label Components | ✅ Complete | 2026-03-08 |
| 2 | Label Interaction | ✅ Complete | 2026-03-08 |
| 3 | Label Management | ✅ Complete | 2026-03-08 |
| 4 | Gamification Core | ✅ Complete | 2026-03-08 |
| 5 | Gamification Depth | ✅ Complete | 2026-03-08 |

---

## Phase 1: Label Components ✅

**Goal:** Extract reusable label components and display labels consistently across all views.

**Requirements:** LBL-01, LBL-02, LBL-03, LBL-04, LBL-05

**Delivered:**
- `LabelBadges.astro` — renders colored label chips (JSON/string/object support, compact mode, max limit)
- `LabelPicker.astro` — typeahead autocomplete from `/api/labels` with create-inline
- Labels visible on tasks, index, today, upcoming, and table views
- kanban: existing inline rendering preserved (is:inline constraint)

---

## Phase 2: Label Interaction ✅

**Goal:** Enable users to filter, search, and manage labels in task workflows.

**Requirements:** LBL-06, LBL-07, LBL-08, LBL-09, LBL-10, LBL-12

**Delivered:**
- `LabelFilterBar.astro` on Kanban and Table pages with `meitheal:label-filter` events
- LabelPicker autocomplete from `/api/labels`
- `PUT /api/labels/:id` and `DELETE /api/labels/:id` endpoints
- `updateVikunjaLabel` / `deleteVikunjaLabel` store functions
- NewTaskModal uses LabelPicker component

---

## Phase 3: Label Management ✅

**Goal:** Provide a dedicated UI for managing all labels and ensure full i18n coverage.

**Requirements:** LBL-11, LBL-13

**Delivered:**
- `SettingsLabels.astro` — Settings → Labels tab with CRUD
- i18n strings in `en.json` and `ga.json` (labels, label_placeholder, labels_hint)

---

## Phase 4: Gamification Core ✅

**Goal:** Introduce gamification with completion celebrations and daily streaks.

**Requirements:** GAM-01, GAM-02, GAM-03, GAM-04

**Delivered:**
- `Confetti.astro` — CSS-only celebration animation (respects `prefers-reduced-motion`)
- `domains/gamification/streak-tracker.ts` — bounded context with DB schema
- `gamification_stats` table (date, completed_count, streak_count, points)
- `StreakBadge.astro` in dashboard stats grid
- Fixed Layout.astro missing `document.` prefix bug

---

## Phase 5: Gamification Depth ✅

**Goal:** Add XP points system, daily goals, progress visualization, and gamification API.

**Requirements:** GAM-05, GAM-06, GAM-07, GAM-08

**Delivered:**
- `onTaskCompleted()` hook wired into tasks, today, and Layout task-detail panel
- Priority-weighted XP: P1=50, P2=40, P3=30, P4=20, P5=10
- `GamificationWidget.astro` — progress ring, XP stats, weekly bar chart
- `/api/gamification` — GET stats + POST completions

---

*Sprint completed: 2026-03-08*
