# Meitheal Codebase Hardening — Roadmap

## Progress

| # | Phase | Status | Plans | Date |
|---|-------|--------|-------|------|
| 1 | Quick Wins | Complete | 1 | 2026-03-07 |
| 2 | TaskRepository Extraction | Planned | – | – |
| 3 | TaskApiClient Wrapper | Planned | – | – |
| 4 | Silent Catch Audit | Planned | – | – |
| 5 | Client Script Extraction | Planned | – | – |
| 6 | Shared Components | Planned | – | – |
| 7 | Performance & Bulk API | Planned | – | – |

---

## [x] Phase 1: Quick Wins ✅ (2026-03-07)

**Goal:** Apply low-risk, high-value fixes identified by the 50-persona audit.

**Requirements:** R-AUDIT-01 through R-AUDIT-05

**Success Criteria:**
1. `sentReminders` Set capped at 1000 entries with FIFO eviction
2. SQLite WAL mode enabled via `PRAGMA journal_mode=WAL`
3. Composite index `tasks(board_id, status)` added
4. Reconnect timer guard prevents orphaned timers in `ha-connection.ts`
5. Typecheck passes with 0 errors

---

## [ ] Phase 2: TaskRepository Extraction

**Goal:** Centralize all task database queries behind a typed `TaskRepository` abstraction, eliminating 6 pages' inline SQL and enforcing DDD boundaries.

**Requirements:** R-AUDIT-06, R-AUDIT-07

**Success Criteria:**
1. `TaskRepository` class exists in `domains/tasks/task-repository.ts`
2. Zero `getPersistenceClient()` imports in any `.astro` page file
3. All task queries parameterized and type-safe via repository methods
4. All 274 E2E tests pass with no regressions
5. Build passes

---

## [ ] Phase 3: TaskApiClient Wrapper

**Goal:** Create a shared client-side fetch wrapper (`TaskApiClient`) that handles ingress path resolution, CSRF headers, and error handling — replacing 63 inline `fetch()` calls.

**Requirements:** R-AUDIT-08

**Success Criteria:**
1. `lib/task-api-client.ts` exists with `get`, `post`, `put`, `patch`, `delete` methods
2. All client-side `fetch()` calls use the shared client
3. CSRF header automatically included on mutations
4. Ingress path resolved once, not per-call
5. Build passes

---

## [ ] Phase 4: Silent Catch Audit

**Goal:** Audit all empty/silent catch blocks and add appropriate error handling — structured logging for server-side, `console.warn` for client-side, intent comments for intentionally silent catches.

**Requirements:** R-AUDIT-09

**Success Criteria:**
1. Zero uncommented empty `catch {}` blocks in `.ts` files
2. Server-side catches use structured `logger.warn/error`
3. Client-side catches use `console.warn` minimum
4. Intentionally silent catches have `/* reason */` comments
5. Build passes

---

## [ ] Phase 5: Client Script Extraction

**Goal:** Extract heavy inline `<script>` blocks from monolith pages into separate `.ts` modules for better code organization and potential code splitting.

**Requirements:** R-AUDIT-10, R-AUDIT-11

**Success Criteria:**
1. `kanban.astro` `<script>` → `kanban-client.ts` (~1,400 lines extracted)
2. `table.astro` `<script>` → `table-client.ts` (~500 lines extracted)
3. `settings.astro` decomposed into sub-components
4. All 274 E2E tests pass
5. Build passes

---

## [ ] Phase 6: Shared Components

**Goal:** Extract duplicated UI patterns into reusable Astro components.

**Requirements:** R-AUDIT-12, R-AUDIT-13

**Success Criteria:**
1. `TaskCard.astro` component used by kanban, index, today, upcoming
2. `TaskListItem.astro` component used by tasks, today, upcoming
3. `StatusPicker.astro` shared across kanban, table, edit modal
4. `PriorityPicker.astro` shared across kanban, table, edit modal
5. Zero visual regressions — identical rendered output

---

## [ ] Phase 7: Performance & Bulk API

**Goal:** Optimize database access patterns and add bulk operations endpoint.

**Requirements:** R-AUDIT-14, R-AUDIT-15

**Success Criteria:**
1. Multi-query pages use `client.batch()` (index, today)
2. `POST /api/tasks/bulk` endpoint exists for batch operations
3. Table view bulk actions use single API call instead of serial fetches
4. AI/strategy modules lazy-loaded via dynamic import
5. Build passes
