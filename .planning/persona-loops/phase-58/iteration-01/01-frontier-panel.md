# Frontier Expert Panel — Phase 58 Iteration 01
## Design & UX Audit (Page-by-Page)

**Objective:** Page-by-page visual, UX, and HA integration audit of all Meitheal views.

**Pages Audited:** Dashboard, Kanban, Tasks, Table, Today, Upcoming, Calendar, Settings (all 4 tabs)

---

### P1: Product Architect
**Finding:** `/upcoming` page renders "You're Offline" screen in standalone (non-HA) mode. Service worker intercepts the navigation request and serves the offline fallback because the page wasn't precached. All other pages render correctly — this one page is a broken user flow.

**Recommendation:** Add `/upcoming` and `/calendar` to the service worker precache manifest (or network-first strategy list) so navigation requests are handled properly even without a live HA Supervisor.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 5 | 2 | 2 | **Accept** |

**Success criterion:** `/upcoming` renders the 7-day grid (not offline page) when accessed via direct navigation in standalone Docker container.

---

### P2: Platform Architect
**Finding:** The `+ New Task` button is missing from the Dashboard header — it only appears on Kanban, Today, and Upcoming pages. The Dashboard is the primary landing page but has no header-level CTA to create tasks. The Quick Add input exists in the body but lacks visual prominence.

**Recommendation:** Add `+ New Task` button to the Dashboard header bar (same as Kanban/Today) so the primary CTA is consistently available on the most-visited page.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 1 | 1 | **Accept** |

**Success criterion:** Dashboard header shows `+ New Task` button matching other pages' styling.

---

### P3: OSS Integrations Specialist
**Finding:** Settings/Integrations tab shows 4 integration cards (Todo Sync, Grocy, n8n, Webhooks) all with "Not configured" state and small blue progress bars. The progress bars suggest partial configuration but are actually just decorative — misleading UX.

**Recommendation:** Replace the decorative blue progress bars on unconfigured integrations with a clear status badge: "Not configured" (grey) / "Connected" (green) / "Error" (red) without progress indicators.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 2 | 1 | **Accept** |

**Success criterion:** Integration cards show semantic status badges, no misleading progress bars.

---

### P4: Reliability Engineer
**Finding:** The Dashboard "Recent Tasks" section loads server-side (SSR) and shows 0 tasks. The stat cards (Total, Active, Completed, Overdue) also show 0. Neither section has loading states — they jump from nothing to content. For a production app with real data, this creates layout shift.

**Recommendation:** Add skeleton loading states (pulsing placeholder cards) for Dashboard stat cards and Recent Tasks list to prevent layout shift on SSR hydration.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 3 | 1 | **Defer** |

**Rationale:** Impact ≥ 4 threshold not met for accept, but valuable for production polish. Defer to Phase 59.

---

### P5: Security Engineer
**Finding:** The Settings/System tab "Download JSON" and "Raw DB" export buttons have no confirmation dialog. In HA context, accidental clicks could trigger large file downloads over the ingress proxy. The "Danger Zone" section (if present below the fold) should have confirmation guards.

**Recommendation:** Add confirmation dialog to "Raw DB" button: "This will download the entire SQLite database file. Continue?"

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 2 | 1 | 1 | **Accept** |

**Success criterion:** "Raw DB" button shows confirmation modal before triggering download.
