# Phase 19: Kanban Board — 50-Persona Expert Panel Audit

## Panel Composition

50 expert personas across product, engineering, design, and accessibility.

---

## Findings by Severity

### 🔴 P0 — Blocking / Embarrassing (fix immediately)

| # | Finding | Personas | Impact |
|---|---------|----------|--------|
| 1 | **Mobile columns don't stack** — horizontal overflow makes board unusable on phone/tablet | UX Designer, Mobile PM, QA Lead, Responsive Web Dev | All mobile users blocked |
| 2 | **Edit redirects to /tasks** — navigating away from Kanban to edit a card destroys context | Product Manager, Kanban Coach, UX Researcher | Workflow disruption, users abandon Kanban view |
| 3 | **Page reload on drag-drop** — `window.location.reload()` after moving a card is jarring | Frontend Architect, Performance Engineer, UX Designer | Feels like 2005 web app |
| 4 | **Test data column visible** — `📌 nm,m,n` column header is clearly garbage data | QA Engineer, Product Owner, Brand Designer | Looks unprofessional, erodes trust |
| 5 | **Lanes button non-functional** — UI element that does nothing on click | QA Lead, Accessibility Auditor, UX Writer | Feature advertised but broken |

### 🟠 P1 — Major UX Gaps (next priority)

| # | Finding | Personas | Impact |
|---|---------|----------|--------|
| 6 | **No card hover state** — cards feel dead/static, no elevation on hover | Interaction Designer, Motion Designer, Frontend Dev | Board feels cheap and unresponsive |
| 7 | **No drag feedback** — no ghost preview, no drop zone highlights, no animation | Drag-Drop Specialist, Accessibility Eng, Interaction Designer | Users unsure if drag is working |
| 8 | **Search doesn't filter board** — global search shows dropdown but cards stay visible | Search UX Specialist, Product Manager, Power User | Kanban search is table-stakes |
| 9 | **Add Task button inconsistent** — 3 columns have ghost style, custom lane has bold style | Visual Designer, Design System Lead, QA | Visual inconsistency signals half-baked |
| 10 | **Board selector is stock `<select>`** — unstyled browser default clashes with dark theme | UI Designer, Design System Eng, Brand Designer | Breaks visual cohesion |
| 11 | **Description unstyled** — raw text under title with no separation or truncation treatment | Content Designer, UX Writer, Typography Expert | Cards look cluttered |
| 12 | **No task detail panel** — can't view full task without leaving page | Product Manager, UX Researcher, Kanban Coach | Core workflow gap |

### 🟡 P2 — Polish & Enhancement (competitive parity)

| # | Finding | Personas | Impact |
|---|---------|----------|--------|
| 13 | **No due-date badges** — due_date data exists but only shows on some cards | Project Manager, Time Management Coach, Scrum Master | Users can't see urgency at a glance |
| 14 | **No label color badges** — labels show as text chips, not color-coded | Visual Designer, Information Architect, PM | Missing quick visual scanning |
| 15 | **No WIP limits** — no ability to set column task limits (Kanban best practice) | Kanban Coach, Agile Coach, Process Engineer | Not a real Kanban without WIP limits |
| 16 | **No keyboard navigation** — can't move cards with arrow keys | Accessibility Eng, Power User, Keyboard-first Dev | a11y gap, power user friction |
| 17 | **No column collapse** — can't minimize completed column to save space | UX Designer, Screen Real Estate Optimizer, PM | Wasted space on large boards |
| 18 | **No card count animation** — counts don't animate on drag-drop | Motion Designer, Interaction Designer | Missed delight moment |
| 19 | **Complete emoji wraps** — ✅ breaks to separate line at narrow widths | Responsive Dev, QA Lead | Visual glitch |
| 20 | **No empty state illustration** — "Drop tasks here" is bare text | Illustration Designer, Onboarding UX, UX Writer | Missed onboarding opportunity |

### 🟢 P3 — Nice-to-Have / Differentiators

| # | Finding | Personas | Impact |
|---|---------|----------|--------|
| 21 | **No card covers/images** — Trello-style cover images | Visual Designer, Content Strategist | Differentiation opportunity |
| 22 | **No assignee avatars** — can't see who owns a task | Team Lead, Scrum Master, Collaboration PM | Multi-user readiness |
| 23 | **No sub-task progress bar** — Linear/Trello show checklist completion | PM, Task Management Researcher | Quick progress scanning |
| 24 | **No time tracking on cards** — Super Productivity shows time spent | Productivity Coach, Time Management Expert | Power user feature |
| 25 | **AI action opens ChatGPT** — should use local LLM or in-app AI | AI/ML Engineer, Privacy Advocate, Self-hosted Advocate | Privacy concern for HA users |

---

## Consensus Verdict

> **The Kanban board is structurally functional (drag-drop works, columns are correct) but visually and interactionally at prototype quality. It would not survive 5 minutes of user testing.** The page reload on drop, redirect-to-edit, and mobile breakage are disqualifying for production use. Priority: fix P0s, then polish P1s, then competitive parity P2s.

## Recommended Phase Architecture

- **Wave 1 (P0):** Mobile stacking, inline task detail panel, optimistic drag-drop (no reload), remove test data, fix lanes button
- **Wave 2 (P1):** Card hover states, drag feedback, search filtering, consistent add-task, styled board selector, description styling
- **Wave 3 (P2):** Due-date badges, label colors, WIP limits, keyboard nav, column collapse, empty state
