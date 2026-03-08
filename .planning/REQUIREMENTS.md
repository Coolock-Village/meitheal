# Gamification + Labels — Requirements

**Project:** Meitheal Gamification + Labels Sprint
**Version:** v1 (derived from gap analysis)
**Date:** 2026-03-08

---

## Labels — Completion (LBL)

- [ ] **LBL-01**: Extract reusable `LabelPicker.astro` component using existing CSS classes (`.label-picker`, `.label-picker__dropdown`)
  - Phase: 1
- [ ] **LBL-02**: Extract reusable `LabelBadges.astro` component from inline kanban rendering
  - Phase: 1
- [ ] **LBL-03**: Label badges visible on Today page task cards
  - Phase: 1
- [ ] **LBL-04**: Label badges visible on Upcoming page task cards
  - Phase: 1
- [ ] **LBL-05**: Label badges visible on Table view rows
  - Phase: 1
- [ ] **LBL-06**: Label filter bar on Kanban page using existing CSS (`.label-filter`, `.label-filter__chip`)
  - Phase: 2
- [ ] **LBL-07**: Label filter bar on Table page
  - Phase: 2
- [ ] **LBL-08**: `LabelPicker` autocomplete from existing labels (fetch from `/api/labels`)
  - Phase: 2
- [ ] **LBL-09**: `PUT /api/labels/:id` endpoint for renaming/recoloring labels
  - Phase: 2
- [ ] **LBL-10**: `DELETE /api/labels/:id` endpoint for removing labels
  - Phase: 2
- [ ] **LBL-11**: Label management UI in Settings page (list, rename, recolor, delete)
  - Phase: 3
- [ ] **LBL-12**: Replace NewTaskModal raw `<input>` with `LabelPicker` component
  - Phase: 2
- [ ] **LBL-13**: i18n strings for label UI in `en.json` and `ga.json`
  - Phase: 3

## Gamification — Foundation (GAM)

- [ ] **GAM-01**: Confetti/celebration CSS animation on task completion
  - Phase: 4
- [ ] **GAM-02**: `domains/gamification/` bounded context with streak tracking
  - Phase: 4
- [ ] **GAM-03**: Daily completion streak counter (reset on missed day) with DB schema (`gamification_stats` table)
  - Phase: 4
- [ ] **GAM-04**: Streak badge visible on dashboard/sidebar
  - Phase: 4
- [ ] **GAM-05**: XP points system (weighted by priority: P1=5x, P5=1x) with running total
  - Phase: 5
- [ ] **GAM-06**: Daily task goal (configurable target, progress ring/bar on dashboard)
  - Phase: 5
- [ ] **GAM-07**: Weekly completed tasks chart on dashboard (last 7 days bar chart)
  - Phase: 5
- [ ] **GAM-08**: `GET /api/gamification/stats` endpoint returning streaks, points, daily progress
  - Phase: 5

## Scope

### v1 (this sprint)
All requirements above (LBL-01 through LBL-13, GAM-01 through GAM-08)

### v2 (deferred)
- Unify dual label system (native JSON + Vikunja compat relational)
- Achievements/badges system
- Productivity stats dashboard page
- Bulk label operations (multi-select add/remove)
- Leaderboard (multi-user)
- Rewards/incentives system (custom rewards)
- Label hierarchy (parent/child labels)

### Out of Scope
- Component decomposition (Layout monolith splitting — separate initiative)
- Inline SQL migration — separate initiative
- Social gamification (party challenges, etc.)

---

*Requirements: 2026-03-08 — gamification + labels gap analysis sprint*
