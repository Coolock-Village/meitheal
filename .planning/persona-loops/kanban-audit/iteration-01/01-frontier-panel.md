# 01 — Frontier Expert Panel: Kanban Board UX Audit

**Date:** 2026-03-02
**Scope:** Kanban board page — `/kanban`

## Audit Matrix

| # | Persona | Finding | Impact | Effort | Risk | Decision |
|---|---------|---------|--------|--------|------|----------|
| 1 | Platform Architect | Columns used fixed 320px width — doesn't adapt to viewport | 5 | 2 | 1 | ✅ Accept |
| 2 | Platform Architect | `is:inline` scripts don't re-run on ViewTransitions swap — edit buttons lose handler | 4 | 3 | 2 | ✅ Accept |
| 3 | UX Engineer | Page alignment inconsistent — title, tabs, filters, columns all different left offsets | 5 | 2 | 1 | ✅ Accept |
| 4 | UX Engineer | Keyboard shortcut hint never permanently dismisses — reappears on every VT nav | 4 | 1 | 1 | ✅ Accept |
| 5 | UX Engineer | Toast notifications appear top-right — user on wide screen doesn't see feedback | 4 | 2 | 1 | ✅ Accept |
| 6 | Product Architect | Edit button falls back to `/tasks#edit-{id}` redirect — jarring context switch | 5 | 2 | 2 | ✅ Accept |
| 7 | Reliability Engineer | Duplicate `+` prefix on Add Task buttons — i18n key includes `+` already | 3 | 1 | 1 | ✅ Accept |
| 8 | Security Engineer | `is:inline` script uses `window.location.href` for fallback — could be ingress-unaware | 3 | 2 | 2 | ✅ Accept |
| 9 | OSS Integration | Column collapse feature was unintuitive UX — users expected click to select, not collapse | 5 | 1 | 1 | ✅ Accept |
| 10 | Product Architect | Drag-drop ghost DOM elements accumulate — visual artifacts especially on top card | 4 | 2 | 1 | ✅ Accept |

## All Accepted — All Implemented
