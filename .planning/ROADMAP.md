# Gamification + Labels — Roadmap

**Project:** Meitheal Gamification + Labels Sprint
**Phases:** 5
**Requirements:** 21
**Date:** 2026-03-08

---

## Progress

| # | Phase | Status | Date |
|---|-------|--------|------|
| 1 | Label Components | Pending | |
| 2 | Label Interaction | Pending | |
| 3 | Label Management | Pending | |
| 4 | Gamification Core | Pending | |
| 5 | Gamification Depth | Pending | |

---

## Phase 1: Label Components

**Goal:** Extract reusable label components and display labels consistently across all views.

**Requirements:** LBL-01, LBL-02, LBL-03, LBL-04, LBL-05

**Success Criteria:**
1. `LabelPicker.astro` component exists and renders the `.label-picker` dropdown with typeahead
2. `LabelBadges.astro` component renders colored label chips and is used on Kanban, Today, Upcoming, and Table views
3. Labels pass visual regression — existing kanban label rendering is identical before/after component extraction

---

## Phase 2: Label Interaction

**Goal:** Enable users to filter, search, and manage labels in task workflows.

**Requirements:** LBL-06, LBL-07, LBL-08, LBL-09, LBL-10, LBL-12

**Success Criteria:**
1. Label filter bar on Kanban and Table pages filters visible tasks by selected label(s)
2. `LabelPicker` shows autocomplete dropdown populated from `/api/labels`
3. `PUT /api/labels/:id` renames/recolors a label and returns updated record
4. `DELETE /api/labels/:id` removes a label and strips it from all tasks
5. NewTaskModal uses `LabelPicker` component instead of raw `<input>`

---

## Phase 3: Label Management

**Goal:** Provide a dedicated UI for managing all labels and ensure full i18n coverage.

**Requirements:** LBL-11, LBL-13

**Success Criteria:**
1. Settings → Labels tab shows all labels with rename, recolor, and delete actions
2. All label-related strings in `en.json` and `ga.json`
3. Labels CRUD works end-to-end from Settings UI through API to DB

---

## Phase 4: Gamification Core

**Goal:** Introduce gamification with completion celebrations and daily streaks.

**Requirements:** GAM-01, GAM-02, GAM-03, GAM-04

**Success Criteria:**
1. Completing a task triggers a confetti/celebration animation (CSS-only, respects `prefers-reduced-motion`)
2. `domains/gamification/` bounded context exists with `streak-tracker.ts`
3. `gamification_stats` DB table tracks daily completion counts and current streak
4. Streak badge visible in sidebar footer showing current streak count + fire emoji

---

## Phase 5: Gamification Depth

**Goal:** Add XP points system, daily goals, progress visualization, and gamification API.

**Requirements:** GAM-05, GAM-06, GAM-07, GAM-08

**Success Criteria:**
1. Tasks award XP on completion, weighted by priority (P1=50XP, P2=40XP, P3=30XP, P4=20XP, P5=10XP)
2. Configurable daily task goal with progress ring on dashboard
3. Weekly bar chart showing tasks completed per day (last 7 days)
4. `GET /api/gamification/stats` returns `{ streak, points, daily_completed, daily_goal, weekly_data }`

---

*Roadmap: 2026-03-08 — gamification + labels sprint*
