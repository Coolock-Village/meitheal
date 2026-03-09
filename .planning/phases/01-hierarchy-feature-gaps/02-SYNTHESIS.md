# Phase 2: SQL Domain Migration — Synthesis Report

**Date:** 2026-03-09
**Phase:** 2 of 4 — SQL Domain Migration
**Status:** COMPLETE ✅

## Executive Summary

Phase 2 migrated 96% of inline SQL from API routes into typed repository classes, establishing a clean domain persistence layer that Phase 3 (Page Decomposition) can consume directly. The migration created 6 repository files with 67+ methods across 1,396 lines of repository code, transforming a tightly-coupled data access pattern into a testable, typed interface. All 286 tests pass with zero regressions, and security was hardened by eliminating all STATUS constant string interpolation in SQL.

The migration also uncovered and fixed a CSS class conflict in Layout.astro, removed dead code, and identified that the 4 remaining inline SQL calls (health probes, PRAGMA checkpoint, Vikunja compat) are correctly kept inline as infrastructure-level operations.

## Key Findings

### Architecture
- **Repository pattern** works well for this codebase — each bounded context (tasks, boards, lanes, settings, users, templates) has its own repository
- **Shared helper extraction** (resolveCalendarEntities) successfully eliminated 60 lines of duplicated settings resolution logic
- **Type interfaces** (BoardRow, LaneRow, StatusCount, etc.) provide compile-time safety for query results

### Quality
- **Zero SQL injection risks** — all string interpolation eliminated, parameterized queries throughout
- **No anti-patterns** in new code — no TODO/FIXME/console.log in repository or helper files
- **5 orphaned type exports** (DashboardStats, BoardInfo, etc.) — actually used by `.astro` page components which grep doesn't capture

### Risks Resolved
- **STATUS interpolation** — 7 instances across 5 files fixed (was safe-by-accident since STATUS is a trusted constant, but set a dangerous pattern)
- **CSS hidden/flex conflict** — Layout.astro `td-parent` and `td-add-subtask-form` elements now properly toggle flex via JavaScript

## Implications for Phase 3 (Page Decomposition)

Phase 3's goal is to extract inline scripts from monolith Astro pages into typed modules. The SQL migration directly enables this:

1. **PGD-01 (Kanban controller)** — Kanban script currently uses `fetch('/api/tasks')` which already hits repositories. Extraction is purely about moving JS to typed `.ts` modules
2. **PGD-02 (Table controller)** — Same pattern. Table page script can import from `lib/table-controller.ts`
3. **PGD-03 (Dashboard controller)** — Dashboard uses TaskRepository indirectly via API routes
4. **PGD-04 (Settings tabs)** — Settings scripts can use SettingsRepository patterns as reference
5. **PGD-05 (Layout controller)** — Layout.astro is 2800+ lines — this is the largest extraction target

### Phase 3 Research Flags
- **No additional research needed** — patterns are well-established in the codebase
- **Layout.astro is the riskiest item** — 2800+ lines of monolith with fetch monkey-patching, modal logic, and ingress handling

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Repository pattern | HIGH | 6 repos, 67+ methods, 286 tests pass |
| Type safety | HIGH | All returns typed, no `any` in repositories |
| Security | HIGH | All interpolation eliminated |
| Integration | HIGH | 29 API routes wired to repositories |
| Phase 3 readiness | HIGH | Domain queries available, extraction is JS→TS only |

## Gaps

None — Phase 2 is fully complete.

---

*Synthesized: 2026-03-09*
