# ADHD/Productivity Panel — Phase 58 Iteration 01
## Design & UX Audit (Page-by-Page)

**Objective:** Reduce cognitive load, improve capture/triage/follow-through across all pages.

---

### P6: Workflow Coach
**Finding:** Navigation between Task views requires sidebar clicks. The top tabs (List view, Kanban Board, Table View, Calendar, Gantt) only appear on Kanban/Table pages. Tasks and Table are separate sidebar items but show the same top-tab navigation — confusing information architecture. User must remember: sidebar = pages, top tabs = view modes of the same data.

**Recommendation:** Consolidate sidebar: "Tasks" and "Table" items should link to the same page with different tab active. Reduce sidebar to: Dashboard, Tasks (default Kanban), Today, Upcoming, Calendar, Settings. The view mode (List/Kanban/Table/Calendar/Gantt) is a tab within Tasks, not a separate destination.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 4 | 3 | 3 | **Defer** |

**Rationale:** High impact but touches sidebar config, URL routing, and user-customizable sidebar settings. Defer to Phase 59 with clear design spec.

---

### P7: Execution Coach
**Finding:** The Kanban board starts with the "Ask Home Assistant" drawer open by default. This takes up screen real estate and isn't the primary use case for the Kanban view. In HA ingress context (smaller viewport inside iframe), this narrows the board columns significantly.

**Recommendation:** Default the "Ask Home Assistant" drawer to collapsed. Persist open/closed state in localStorage so the user's preference survives page refreshes.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 1 | 1 | **Accept** |

**Success criterion:** Kanban page loads with HA drawer collapsed. Opening it persists in localStorage.

---

### P8: Knowledge Coach
**Finding:** The Today page has an excellent "Add a task..." input with example placeholder text ("try 'Buy groceries tomorrow' or 'Review docs every monday'"). This natural-language hint teaches the user what the quick-add supports. The Dashboard Quick Add input says only "What needs to be done?" — less helpful.

**Recommendation:** Update Dashboard Quick Add placeholder to match Today's format: "What needs to be done? (try 'Buy groceries' or 'Review docs weekly')" to teach users about natural language input.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 2 | 1 | 1 | **Accept** |

**Success criterion:** Dashboard Quick Add placeholder shows example text matching Today's style.

---

### P9: Focus Optimizer
**Finding:** Settings page has 4 tabs (General, Integrations, Agents & AI, System & Danger). When accessed from sidebar, it defaults to "General" — the least likely tab a returning user needs. Returning users typically want Integrations or System status.

**Recommendation:** Support URL hash-based tab selection (`/settings#integrations`, `/settings#system`) so deep-links to specific settings tabs work from external contexts (HA panels, documentation, error messages).

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 1 | 1 | **Accept** |

**Success criterion:** Navigating to `/settings#integrations` lands on the Integrations tab.

---

### P10: Automation Coach
**Finding:** The keyboard shortcuts grid in Settings/System shows shortcuts (n=New, /=Search, Ctrl+B=Sidebar, k=Kanban, etc.) but there's no visual affordance on any page that these shortcuts exist. The only hint is "Press ? for keyboard shortcuts" ribbon in the top-right, which is easy to miss.

**Recommendation:** Add a toast/tooltip on first visit that says "Press ? to see keyboard shortcuts" — auto-dismiss after 5 seconds, don't show again if dismissed (localStorage flag).

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 2 | 2 | 1 | **Defer** |

**Rationale:** Nice-to-have but effort matches impact. Defer.
