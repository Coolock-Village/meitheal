# Code Quality & UX Happiness — Requirements

**Project:** Meitheal Quality & UX Happiness Sprint
**Version:** v1 (derived from 50-persona audit)
**Date:** 2026-03-08

---

## Accessibility (A11Y)

- [x] **A11Y-01**: All animations respect `prefers-reduced-motion` (disable transforms, reduce durations)
  - Phase: 1
- [x] **A11Y-02**: Command palette has proper focus trap (Tab cycling, Escape closes)
  - Phase: 1
- [x] **A11Y-03**: New task modal auto-focuses first input on open
  - Phase: 1
- [x] **A11Y-04**: Skip-to-content link present for keyboard users
  - Phase: 1
- [x] **A11Y-05**: All icon-only buttons have `aria-label` attributes
  - Phase: 1

## Code Quality (CQ)

- [x] **CQ-01**: All 11 empty `catch {}` blocks replaced with `console.warn` or error handling
  - Phase: 2
- [x] **CQ-02**: All `console.log` in production code removed or replaced with structured logger
  - Phase: 2
- [x] **CQ-03**: Shared API fetch utility created at `@lib/api.ts` with typed response handling
  - Phase: 2
- [x] **CQ-04**: innerHTML instances audited and replaced with textContent/DOM API where user data is rendered
  - Phase: 2

## Memory & Performance (MP)

- [x] **MP-01**: `ingress-state-persistence.ts` listeners use AbortController signal for cleanup
  - Phase: 3
- [x] **MP-02**: SW update check interval has clearInterval on page unload
  - Phase: 3
- [x] **MP-03**: HA reconnect setTimeout has cancel mechanism to prevent orphaned timers
  - Phase: 3
- [x] **MP-04**: All unbounded `new Map()` caches have max-size eviction or TTL
  - Phase: 3

## UI/UX Polish (UX)

- [x] **UX-01**: Destructive actions (delete task) have undo toast with timeout
  - Phase: 4
- [x] **UX-02**: Failed API calls show error UI with retry button
  - Phase: 4
- [x] **UX-03**: Kanban drag/drop uses optimistic updates (show change instantly, rollback on failure)
  - Phase: 4
- [x] **UX-04**: Page navigation loading bar visible during transitions
  - Phase: 4

## Mobile & Touch (MT)

- [x] **MT-01**: Delete row button meets 44×44px minimum touch target
  - Phase: 5
- [x] **MT-02**: Mobile sidebar supports swipe-to-open/close gesture
  - Phase: 5
- [x] **MT-03**: All interactive custom elements have `tabindex="0"` for keyboard access
  - Phase: 5

## Scope

### v1 (this sprint)
All requirements above

### v2 (deferred)
- High-contrast mode styles
- Confetti on "all tasks complete"
- Task detail panel drag-to-resize
- Auto-capitalization on mobile inputs
- First-use onboarding wizard
- WebSocket keep-alive ping mechanism

### Out of Scope
- Component extraction (Layout, settings, kanban monolith splitting — separate initiative)
- Inline SQL migration to domain service layer — separate initiative
- Page script extraction to TypeScript modules — separate initiative

---

*Requirements audit: 2026-03-08 — quality-ux-happiness sprint*
