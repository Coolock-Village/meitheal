# Code Quality & UX Happiness — Roadmap

**Project:** Meitheal Quality & UX Happiness Sprint
**Phases:** 5
**Requirements:** 17
**Date:** 2026-03-08

---

## Progress

| # | Phase | Status | Date |
|---|-------|--------|------|
| 1 | Accessibility Foundation | Pending | |
| 2 | Code Hygiene & Safety | Pending | |
| 3 | Memory & Performance Guard | Pending | |
| 4 | UX Polish & Happiness | Pending | |
| 5 | Mobile & Touch Quality | Pending | |

---

## Phase 1: Accessibility Foundation

**Goal:** All users — including keyboard-only, screen reader, and motion-sensitive users — can fully interact with Meitheal.

**Requirements:** A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05

**Success Criteria:**
1. `@media (prefers-reduced-motion: reduce)` disables all CSS transforms and reduces animation durations
2. Tab key cycles within command palette; Escape closes it; focus doesn't escape
3. Opening new task modal puts focus on the title input
4. Skip-to-content link is the first focusable element on every page
5. Every icon-only button has a descriptive `aria-label`

---

## Phase 2: Code Hygiene & Safety

**Goal:** Eliminate silent error swallowing, remove debug traces, create shared abstractions, and harden against XSS.

**Requirements:** CQ-01, CQ-02, CQ-03, CQ-04

**Success Criteria:**
1. Zero empty `catch {}` blocks in codebase (grep returns 0)
2. Zero `console.log` in production code (grep returns 0)
3. Shared `@lib/api.ts` exists and is used by at least 3 callers
4. No `innerHTML` assignment with user-controlled data

---

## Phase 3: Memory & Performance Guard

**Goal:** Prevent memory leaks from orphaned timers and listeners, and bound all caches.

**Requirements:** MP-01, MP-02, MP-03, MP-04

**Success Criteria:**
1. `ingress-state-persistence.ts` listeners are cleaned up via AbortController on page transitions
2. SW update interval is cleared on page unload
3. HA reconnect timeout is tracked and cancelled on successful reconnect
4. All `new Map()` instances have documented max-size or TTL eviction

---

## Phase 4: UX Polish & Happiness

**Goal:** Reduce frustration and increase delight through undo, retry, optimistic updates, and loading feedback.

**Requirements:** UX-01, UX-02, UX-03, UX-04

**Success Criteria:**
1. Deleting a task shows undo toast; clicking undo restores it
2. Failed fetch calls render an inline error with a "Retry" button
3. Kanban drag/drop immediately reflects the new position (rolls back if API fails)
4. A thin loading bar/indicator shows during Astro page transitions

---

## Phase 5: Mobile & Touch Quality

**Goal:** Every touch interaction meets platform expectations and accessibility standards.

**Requirements:** MT-01, MT-02, MT-03

**Success Criteria:**
1. Delete button passes 44×44px minimum touch target audit
2. Swipe right from left edge opens sidebar on mobile
3. All custom interactive elements are keyboard-focusable

---

*Roadmap: 2026-03-08 — quality-ux-happiness sprint*
