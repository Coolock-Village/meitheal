# 50-Persona Codebase Quality Audit

**Focus:** Unification, Shared Components, Optimizations, Memory Leak Elimination, Reliability, Performance
**Codebase:** 183 files, ~24,500 lines (TS + Astro)
**Date:** 2026-03-07

---

## Audit Methodology

10 passes × 5 personas per pass = 50 expert perspectives across:
1. **Component Unification** — duplicated patterns, shared component extraction
2. **Memory Safety** — leaks, unbounded caches, timer/listener cleanup
3. **Reliability** — error handling, silent failures, data integrity
4. **Performance** — bundle size, SQL efficiency, render efficiency
5. **Architecture** — domain boundary violations, code organization

---

## Pass 1: Component Architecture

### Persona 1 — Senior React/Astro Architect
**Verdict:** 🔴 Critical duplication in page files

| Issue | Severity | Evidence |
|-------|----------|----------|
| `settings.astro` is 3,517 lines — monolith page | P1 | Should be broken into sub-components |
| `kanban.astro` is 2,588 lines | P1 | Drag/drop, lanes, cards should be components |
| `table.astro` is 1,106 lines | P2 | Inline sort/filter/bulk-action logic |
| 6 pages import `getPersistenceClient` directly for inline SQL | P1 | Bypasses domain layer — violates DDD |
| 63 inline `fetch()` calls across page `<script>` blocks | P2 | No shared API client/fetch wrapper |

### Persona 2 — Frontend Component Engineer
**Verdict:** 🟡 Missing shared abstractions

| Issue | Severity | Evidence |
|-------|----------|----------|
| No shared `TaskCard` component — each view builds cards inline | P2 | kanban, index, today, upcoming all render task cards differently |
| No shared `TaskListItem` component | P2 | tasks.astro, today.astro, upcoming.astro repeat list item markup |
| No shared `StatusSelect` / `PrioritySelect` component | P3 | Each page re-implements status/priority dropdowns |
| `showToast` used in 15+ places via `import` — correct pattern | ✅ | Already extracted |
| `SidebarBoardSwitcher`, `TaskViewTabs` used across pages | ✅ | Already shared |

### Persona 3 — CSS Systems Engineer
**Verdict:** 🟢 Well-structured with minor issues

| Issue | Severity | Evidence |
|-------|----------|----------|
| CSS partials well-organized (`_cards.css`, `_layout.css`, etc.) | ✅ | Good separation |
| `.badge-done` and `.badge-complete` both defined on same rule | P4 | Legacy alias — can remove `.badge-done` after status normalization |
| Some `<style>` blocks in Astro pages duplicate token values | P3 | gantt.astro has 158-line scoped style |

### Persona 4 — i18n Engineer
**Verdict:** 🟢 Translations properly externalized

| Issue | Severity | Evidence |
|-------|----------|----------|
| `t()` function correctly used across pages | ✅ | en/ga locales |
| Some inline English strings in JS blocks | P4 | "All caught up", "Open Tasks" |

### Persona 5 — Astro Framework Expert
**Verdict:** 🟡 Page scripts too heavy

| Issue | Severity | Evidence |
|-------|----------|----------|
| Client-side scripts embedded directly in `<script>` in pages | P2 | Should be extracted to `.ts` modules for code splitting |
| `kanban.astro` has ~1,400 lines of client JS in `<script>` | P1 | Extract to `kanban-client.ts` |
| `table.astro` has ~500 lines of client JS | P2 | Extract to `table-client.ts` |

---

## Pass 2: Memory Safety

### Persona 6 — Memory Leak Specialist
**Verdict:** 🔴 Critical — addEventListener imbalance

| Issue | Severity | Evidence |
|-------|----------|----------|
| **380 addEventListener calls vs 3 removeEventListener** | P0 | Every page navigation re-attaches listeners without cleanup |
| Astro MPA: full page reload clears DOM listeners | Context | Not a leak for MPA navigation — mitigated by architecture |
| But `Layout.astro` scripts persist across soft-navigations | P2 | If view transitions enabled, listeners accumulate |

**Assessment:** For pure MPA (full page reloads), this is architecturally mitigated. BUT — if Astro View Transitions are ever added, this becomes a P0 memory leak. Add `document.addEventListener` cleanup in an `astro:before-swap` event handler as future-proofing.

### Persona 7 — Timer/Interval Auditor
**Verdict:** 🟡 Mostly well-managed with spots to fix

| Issue | Severity | Evidence |
|-------|----------|----------|
| `sw-register.ts:79` — `setInterval` for update checks — no `clearInterval` on page unload | P2 | Runs forever (300s cycle) |
| `connectivity.ts` — health check interval tracks handle, clears on disconnect | ✅ | Properly managed |
| `calendar-bridge.ts` — sync intervals per entity, tracked in activeSyncs Map | ✅ | `stopSync()` clears timers |
| `grocy-bridge.ts` — similar pattern, properly managed | ✅ | Has `stopGrocySync()` |
| `due-date-reminders.ts:172` — interval tracked in `intervalHandle` | ✅ | `stopReminderChecks()` exists |
| `ha-connection.ts:208` — reconnect `setTimeout` fires on error, but no cancel mechanism | P3 | Could orphan if connection resets rapidly |

### Persona 8 — Cache Bounds Auditor
**Verdict:** 🟡 Several unbounded caches

| Issue | Severity | Evidence |
|-------|----------|----------|
| `ha-entities.ts:23` — `changeListeners` Map never evicts | P3 | Grows with entity subscriptions |
| `calendar-bridge.ts:83` — `activeSyncs` Map — bounded by entity count | ✅ | Bounded |
| `calendar-bridge.ts:96` — `debounceTimers` Map — self-cleaning | ✅ | Timers delete their keys |
| `due-date-reminders.ts:45` — `sentReminders` Set grows indefinitely | P2 | "taskId:date" strings accumulate forever |
| `todo-bridge.ts:59` — `activeSyncs` Map — bounded by entity count | ✅ | Bounded |
| `grocy-bridge.ts:499` — Map created in function scope | ✅ | GC'd after function |

### Persona 9 — Database Connection Auditor
**Verdict:** 🟢 Well-managed singleton

| Issue | Severity | Evidence |
|-------|----------|----------|
| `store.ts` — singleton `getClient()` pattern | ✅ | No connection leaks |
| No connection pool (libSQL in-process) | ✅ | Appropriate for SQLite |

### Persona 10 — AbortController Auditor
**Verdict:** 🟢 Consistently used

| Issue | Severity | Evidence |
|-------|----------|----------|
| `connectivity.ts:58` — timeout via AbortController | ✅ | Good pattern |
| `sync-engine.ts:166` — fetch timeout 10s | ✅ | Properly aborted |
| `caldav-client.ts:126` — TIMEOUT_MS via AbortController | ✅ | Good pattern |
| `ha-startup.ts:495` — 5s timeout | ✅ | Properly managed |

---

## Pass 3: Reliability

### Persona 11 — Error Handling Reviewer
**Verdict:** 🔴 226 empty/silent catch blocks

| Issue | Severity | Evidence |
|-------|----------|----------|
| 226 `catch {}` or `catch (err) { /* ignored */ }` blocks | P1 | Silent failures make debugging impossible |
| `ai-context-service.ts` — 10+ empty catch blocks | P2 | AI features silently fail |
| Pages `try/catch` around SQL: empty catch shows empty state | P3 | Acceptable for graceful degradation, but should log |
| API routes should ALWAYS log errors | P1 | Some already migrated to `api-logger.ts` |

### Persona 12 — Data Integrity Engineer
**Verdict:** 🟢 Solid

| Issue | Severity | Evidence |
|-------|----------|----------|
| `withTransaction()` for multi-step writes | ✅ | Proper rollback |
| Idempotency keys prevent duplicates | ✅ | Good pattern |
| `ensureSchema()` idempotent migrations | ✅ | Safe to call multiple times |
| Status normalization migration in schema boot | ✅ | `done` → `complete` on startup |

### Persona 13 — Concurrent Access Analyst
**Verdict:** 🟡 Minor concerns

| Issue | Severity | Evidence |
|-------|----------|----------|
| SQLite WAL mode not explicitly enabled | P3 | Default journal mode — could block concurrent reads during writes |
| No request-level transaction isolation | P4 | Single-user addon context mitigates |
| `syncingEntities` Set used as mutex — not truly atomic | P3 | Could race under concurrent calendar syncs |

### Persona 14 — Input Validation Reviewer
**Verdict:** 🟢 Good with `validation.ts`

| Issue | Severity | Evidence |
|-------|----------|----------|
| `validation.ts` provides input sanitization | ✅ | Centralized |
| SQL parameterized queries used consistently | ✅ | No SQL injection risk |
| CSRF middleware active on mutations | ✅ | Origin header check |

### Persona 15 — Type Safety Analyst
**Verdict:** 🟡 20 `as any` remaining

| Issue | Severity | Evidence |
|-------|----------|----------|
| 20 `as any` casts remaining | P3 | Down from 30+ (OA-427) but still present |
| 188 `Record<string, unknown>` — correct but verbose | P4 | Consider typed interfaces for common query results |
| 11 `as unknown` — correct pattern for necessary casts | ✅ | Safe |

---

## Pass 4: Performance

### Persona 16 — SQL Query Optimizer
**Verdict:** 🟡 Inline SQL bypassing domain layer

| Issue | Severity | Evidence |
|-------|----------|----------|
| 6 pages execute inline SQL via `getPersistenceClient()` | P2 | index, kanban, calendar, gantt, today, upcoming |
| No query caching or prepared statements | P3 | Each page load re-parses identical SQL |
| Multiple sequential queries per page load (e.g., index.astro has 5+ queries) | P2 | Could batch with `client.batch()` |
| No indexes on `board_id + status` composite | P3 | Kanban filters by both |

### Persona 17 — Bundle Size Analyst
**Verdict:** 🟢 Under budget

| Issue | Severity | Evidence |
|-------|----------|----------|
| Client bundle ≤ 100KB (CI enforcement) | ✅ | `perf-budget-check.mjs` |
| Largest client chunk: Layout script ~270KB (gzipped ~92KB) | P3 | Large but acceptable |
| `home-assistant-js-websocket` in client bundle | P3 | Only needed server-side — tree-shaking issue? |

### Persona 18 — Render Performance Engineer
**Verdict:** 🟢 SSR-first is correct

| Issue | Severity | Evidence |
|-------|----------|----------|
| Pages are server-rendered (Astro SSR) | ✅ | No client-side rendering bottleneck |
| No virtual scrolling for large task lists | P3 | table.astro renders all rows — fine for <1000 tasks |
| Kanban drag-and-drop DOM manipulation inline | P3 | Could benefit from requestAnimationFrame batching |

### Persona 19 — Network Efficiency Analyst
**Verdict:** 🟡 Some optimization opportunities

| Issue | Severity | Evidence |
|-------|----------|----------|
| Checkbox toggle: sends full `PUT` for single field change | P4 | Could use `PATCH` |
| Bulk operations in table.astro: serial `fetch` per task | P2 | Should batch with single API call |
| No response caching (ETag/Last-Modified) on `GET /api/tasks` | P3 | Addon context — low priority |

### Persona 20 — Startup Performance Analyst
**Verdict:** 🟢 Fast

| Issue | Severity | Evidence |
|-------|----------|----------|
| `ensureSchema()` runs ~50 DDL statements on cold start | P4 | Idempotent but verbose — could cache "schema ready" flag in DB |
| HA connection with 15s timeout guard | ✅ | Won't block startup |

---

## Pass 5: Architecture & DDD

### Persona 21 — DDD Architect
**Verdict:** 🔴 Domain boundaries violated

| Issue | Severity | Evidence |
|-------|----------|----------|
| 6 Astro pages import `getPersistenceClient` directly | P1 | Pages should call domain services, not raw DB |
| No `TaskService` or `TaskRepository` abstraction | P1 | All pages query DB directly with inline SQL |
| Domain layer exists for calendar, ha, notifications, todo | ✅ | But missing for core task CRUD |
| `store.ts` (861 lines) mixes schema + queries + business logic | P2 | Should split into Store (schema) + Repository (queries) |

### Persona 22 — API Design Reviewer
**Verdict:** 🟢 Well-structured

| Issue | Severity | Evidence |
|-------|----------|----------|
| RESTful `/api/tasks/[id]` pattern | ✅ | Standard |
| CSRF protection | ✅ | Origin check |
| Rate limiting | ✅ | In place |
| Structured error responses | ✅ | Error codes |

### Persona 23 — Monorepo Architect
**Verdict:** 🟡 Packages underutilized

| Issue | Severity | Evidence |
|-------|----------|----------|
| `packages/domain-strategy` exists but RICE scoring inline in pages | P3 | Should use the package |
| `packages/domain-tasks` exists — unclear if used | P3 | Check usage |
| `packages/domain-auth` — proper package | ✅ | Used |
| `packages/integration-core` — proper package | ✅ | Used |

### Persona 24 — Testing Architect
**Verdict:** 🟡 Good coverage with gaps

| Issue | Severity | Evidence |
|-------|----------|----------|
| 274 passing E2E tests | ✅ | Good foundation |
| No unit tests for page-level inline SQL queries | P2 | Can't test without starting server |
| No unit tests for `ai-context-service.ts` | P3 | 10 catch blocks — hard to debug |
| Governance test failing (version consistency) | P3 | Pre-existing issue |

### Persona 25 — KCS Documentation Reviewer
**Verdict:** 🟢 Excellent

| Issue | Severity | Evidence |
|-------|----------|----------|
| JSDoc on all domain functions | ✅ | With @domain tags |
| `.planning/codebase/` with 7 docs | ✅ | STACK, ARCHITECTURE, etc. |
| REQUIREMENTS.md exists | ✅ | Traceable |
| Inline code comments explain "why" | ✅ | Good KCS practice |

---

## Passes 6-10: Cross-Cutting Synthesis

### Persona 26-30 — Shared Component Extraction Team

**Recommended extractions (impact × effort matrix):**

| Component | Impact | Effort | Pages Affected | Priority |
|-----------|--------|--------|----------------|----------|
| `TaskApiClient` — shared fetch wrapper with ingress/CSRF | High | Low | All 12 pages | P1 |
| `TaskRepository` — domain service for task CRUD queries | High | Medium | 6 pages with inline SQL | P1 |
| `TaskCard.astro` — unified card component | High | Medium | kanban, index, today, upcoming | P2 |
| `TaskListItem.astro` — unified list item | Medium | Low | tasks, today, upcoming | P2 |
| `PageScript` extraction — move inline `<script>` to `.ts` | Medium | Medium | kanban, table, settings | P2 |
| `StatusPicker.astro` — shared status dropdown | Low | Low | kanban, table, edit modal | P3 |
| `PriorityPicker.astro` — shared priority dropdown | Low | Low | kanban, table, edit modal | P3 |
| `BatchedSqlQueries` — use `client.batch()` for page loads | Medium | Low | index (5 queries), today (3) | P3 |

### Persona 31-35 — Memory & Reliability Hardening Team

**Priority fixes:**

| Fix | Severity | Location | Description |
|-----|----------|----------|-------------|
| Add `sentReminders` eviction | P2 | `due-date-reminders.ts:45` | Cap at 1000 entries, evict oldest |
| Add `astro:before-swap` cleanup | P2 | Layout.astro | Clear timers/listeners on soft navigation |
| Log in silent catch blocks | P1 | 226 blocks across codebase | At minimum `console.warn` in dev, structured log in prod |
| Enable WAL mode on SQLite | P3 | `store.ts` init | `PRAGMA journal_mode=WAL` |
| Guard rapid reconnect in ha-connection | P3 | `ha-connection.ts:208` | Track pending reconnect timer, cancel before new |

### Persona 36-40 — Performance Optimization Team

**Priority optimizations:**

| Optimization | Impact | Effort | Description |
|-------------|--------|--------|-------------|
| Batch page SQL queries | Medium | Low | Use `client.batch()` for index/today multi-query pages |
| Extract kanban client script | Medium | Medium | Move 1,400 lines to `kanban-client.ts` |
| Bulk API endpoint | Medium | Medium | `POST /api/tasks/bulk` for table batch operations |
| Composite index `board_id + status` | Low | Low | Single `CREATE INDEX` statement |
| Lazy-load AI/strategy modules | Low | Low | Dynamic import for optional features |

### Persona 41-45 — Reliability & Observability Team

**Priority reliability fixes:**

| Fix | Impact | Effort | Description |
|-----|--------|--------|-------------|
| `TaskRepository` abstraction | High | Medium | All task DB access through typed repository — eliminates inline SQL risks |
| Structured logging for silent catches | High | Low | Replace empty catch with `logger.debug` minimum |
| `syncingEntities` race guard | Medium | Low | Atomic check-and-set with lock |
| Calendar sync error recovery | Medium | Low | Auto-retry with exponential backoff on transient errors |

### Persona 46-50 — Production Readiness Review Board

**Release blockers:**
- None — app is functional and stable

**Release recommendations (ordered by risk reduction):**

| # | Item | Risk | Effort |
|---|------|------|--------|
| 1 | Task Repository extraction | Prevents SQL bugs in pages | Medium |
| 2 | Silent catch audit | Prevents silent production failures | Low |
| 3 | TaskApiClient shared wrapper | Prevents fetch boilerplate bugs | Low |
| 4 | sentReminders memory cap | Prevents memory growth in long sessions | Low |
| 5 | Kanban script extraction | Reduces page complexity | Medium |
| 6 | Bulk operations API | Improves table UX | Medium |
| 7 | WAL mode for SQLite | Improves concurrent reliability | Low |
| 8 | Composite indexes | Improves query performance | Low |
| 9 | Settings page decomposition | Reduces cognitive load | High |
| 10 | Page script extraction | Improves code organization | Medium |

---

## Summary — Top 10 Actions

| # | Action | Priority | Type | Effort |
|---|--------|----------|------|--------|
| 1 | Create `TaskRepository` — centralize all task SQL queries | P1 | Unification | Medium |
| 2 | Create `TaskApiClient` — shared fetch wrapper with ingress/CSRF | P1 | Unification | Low |
| 3 | Audit and add logging to 226 empty catch blocks | P1 | Reliability | Low |
| 4 | Cap `sentReminders` Set at 1000 entries | P2 | Memory | Low |
| 5 | Extract kanban/table/settings client scripts to `.ts` files | P2 | Optimization | Medium |
| 6 | Create shared `TaskCard.astro` and `TaskListItem.astro` | P2 | Unification | Medium |
| 7 | Batch SQL queries on multi-query pages with `client.batch()` | P2 | Performance | Low |
| 8 | Add `PRAGMA journal_mode=WAL` | P3 | Reliability | Low |
| 9 | Add composite index `tasks(board_id, status)` | P3 | Performance | Low |
| 10 | Create bulk operations API endpoint | P3 | Performance | Medium |
