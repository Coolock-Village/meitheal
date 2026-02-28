# Phase 11: Discuss — Vikunja Feature Audit + Security + Web API

## Context

Phase 11 is a **full GSD cycle** (discuss → persona → plan → execute → verify) performing a 1:1 feature check against Vikunja, informed by:

1. **Vikunja Security Advisory (GHSA-rfjg-6m84-crj2)** — Password reset token reuse (account takeover)
2. **Vikunja Community Top Feature Requests** — 50+ community-sourced features
3. **MDN Web API** — Ensure modern web standards compliance
4. **Vikunja Cloud instance** — Feature reference

## Security Audit

### Vikunja Vulnerability: Password Reset Token Reuse
- **CVE**: Token not invalidated after use + inverted cleanup cron logic
- **Meitheal Status**: ✅ **IMMUNE** — Meitheal uses HA ingress authentication (`hassio_token` header). No password reset flow exists. No token-based auth at all (auth delegated to HA Supervisor).
- **Action**: Document our auth model as a security advantage

## Vikunja Community Top Feature Requests (Ranked by Votes)

| Feature | Community Rank | Meitheal Status | Gap? |
| --- | --- | --- | --- |
| Sub-projects/nested lists | 1 | ❌ Flat list | Yes |
| Time tracking (stopwatch) | 2 | ❌ | Yes |
| Dark mode | 3 | ✅ Dark-only | No |
| Quick Add Magic autocomplete | 4 | ⚠️ #label + dates, no autocomplete | Partial |
| Saved filters (advanced) | 5 | ⚠️ Basic status/priority | Partial |
| Offline capabilities | 6 | ❌ | Yes |
| Task dependencies | 7 | ❌ | Yes |
| Markdown first-class | 8 | ❌ Plain text only | Yes |
| Add multiple tasks at once | 9 | ❌ | Yes |
| Task checklists/subtasks | 10 | ❌ | Yes |
| Keyboard shortcuts | 11 | ✅ /, ?, l, k, t | No |
| Task coloring taxonomy | 12 | ⚠️ Priority colors only | Partial |
| Copy/duplicate task | 13 | ❌ | Yes |
| Custom fields | 14 | ✅ Framework payload (RICE etc.) | No |
| Close modal w/ Escape | 15 | ✅ Click-outside closes | No |
| Sort favorites manually | 16 | ❌ | Yes |
| Filter exclude tags | 17 | ❌ | Yes |
| Time format config | 18 | ❌ | Yes |
| Auto-reminders | 19 | ❌ | Yes |

## What We Will Implement (P0-P2)

### P0: Must Have (Foundational)
1. **Duplicate task** — copy task to same status with "(Copy)" suffix
2. **Escape key** to close all modals (currently only click-outside)
3. **Markdown description** — render description as markdown

### P1: High Impact
4. **Task checklists** — checkboxes within task description
5. **Bulk add tasks** — paste multi-line text to create many tasks
6. **Saved filters** — save/load filter presets to settings API
7. **Task coloring** — label-based or custom color per task

### P2: Medium Impact
8. **Quick Add Magic autocomplete** — show label suggestions as user types #
9. **Time format config** — 12h/24h preference in settings
10. **Default view preference** — remember last view (list/kanban/table)

## Web API Standards Check

Using MDN Web API references, verify:
- ✅ `fetch()` with proper error handling
- ✅ `localStorage` for client-side persistence
- ✅ `AbortController` — NOT used currently, should add for fetch timeout
- ✅ Semantic HTML elements (`nav`, `main`, `header`)
- ✅ `aria-*` attributes throughout
- ⚠️ No `<dialog>` element — modals use custom CSS overlays
- ⚠️ No `IntersectionObserver` for lazy loading

## Security Advantage Documentation

Meitheal is architecturally immune to the class of vulnerabilities affecting Vikunja:
- **No user accounts** — auth delegated to HA Supervisor
- **No password flow** — ingress handles authentication
- **No reset tokens** — nothing to reuse
- **Token validation** — `SUPERVISOR_TOKEN` validated per-request
- **Input sanitization** — HTML stripping, length limits, enum validation on all API routes
