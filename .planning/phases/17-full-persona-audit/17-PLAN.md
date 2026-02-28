---
wave: 1
depends_on: []
files_modified:
  - apps/web/src/pages/api/tasks/index.ts
  - apps/web/src/pages/api/tasks/[id].ts
  - apps/web/src/pages/api/tasks/[id]/comments.ts
  - apps/web/src/pages/api/boards/index.ts
  - apps/web/src/pages/api/boards/[id].ts
  - apps/web/src/pages/api/settings.ts
  - apps/web/src/pages/api/labels.ts
  - apps/web/src/pages/api/health.ts
  - apps/web/src/domains/tasks/persistence/store.ts
  - apps/web/src/domains/tasks/task-sync-service.ts
  - apps/web/src/middleware.ts
  - apps/web/src/pages/tasks.astro
  - apps/web/src/pages/kanban.astro
  - apps/web/src/pages/table.astro
  - apps/web/src/pages/settings.astro
  - apps/web/src/pages/index.astro
  - apps/web/src/layouts/Layout.astro
  - apps/web/src/lib/toast.ts
  - apps/web/src/lib/task-api.ts
  - apps/web/src/lib/debounce.ts
autonomous: true
---

# Phase 17: Full 50-Persona Audit — Plan

## Goal

Audit every domain, function, and architectural decision in Meitheal against 50 personas across 4 panels (Frontier, ADHD, Domain-Specific, End-User). Produce a findings report and fix all identified issues. Zero findings must remain.

## must_haves

- Every API endpoint audited for input validation, error handling, auth
- Every UI page audited for a11y, responsive design, keyboard nav
- Every domain audited for DDD boundary compliance
- Every KCS artifact reviewed for accuracy
- All fixes pass validation gates (pnpm check, tests, perf:budget, schema:drift)
- Perf budget headroom maintained (currently 220B — cannot exceed 81920 client bytes)

## Wave 1: Backend Audit (API + Schema + Security)

<task id="17-01" title="Tasks API audit">
Review tasks/index.ts, tasks/[id].ts, tasks/[id]/comments.ts against:
- Input validation completeness (all fields validated, length limits, type checks)
- Error response consistency (structured JSON, appropriate HTTP codes)
- SQL injection prevention (parameterized queries only)
- XSS prevention (HTML strip on all text inputs)
- Missing fields in SELECT (ensure all columns returned)
- Rate limiting / abuse prevention
- Auth enforcement (ingress header validation)
Files: tasks/index.ts, tasks/[id].ts, tasks/[id]/comments.ts
</task>

<task id="17-02" title="Boards API audit">
Review boards/index.ts, boards/[id].ts against:
- CRUD completeness (GET list, GET single, POST, PUT, DELETE)
- Cascade behavior on delete (tasks referencing board)
- Input validation (title length, icon, color format)
- Default board protection (cannot delete default)
Files: boards/index.ts, boards/[id].ts
</task>

<task id="17-03" title="Schema integrity audit">
Review store.ts migration sequence:
- Column types match usage (TEXT vs INTEGER)
- NOT NULL constraints where required
- Default values appropriate
- Foreign key constraints present and correct
- Index coverage for common queries
- Migration idempotency (hasColumn checks everywhere)
Files: store.ts
</task>

<task id="17-04" title="Security middleware audit">
Review middleware.ts against OWASP Top 10:
- CSP headers (strict, no unsafe-inline)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- CORS configuration
- HA ingress auth enforcement
- Input sanitization consistency
Files: middleware.ts, auth/ingress.ts
</task>

<task id="17-05" title="Settings + Health + Labels API audit">
Review settings.ts, health.ts, labels.ts:
- Settings validation (Zod schema enforcement)
- Health endpoint reliability
- Labels CRUD completeness
- Error handling consistency
Files: settings.ts, health.ts, labels.ts
</task>

## Wave 2: Frontend Audit (UI + A11y + UX)

<task id="17-06" title="Tasks page UI audit">
Review tasks.astro against 50 personas:
- WCAG 2.1 AA compliance (contrast, focus indicators, ARIA)
- Keyboard navigation (tab order, enter/escape, shortcuts)
- Screen reader compatibility (live regions, announcements)
- Responsive design (mobile, tablet breakpoints)
- Empty state handling
- Loading state (skeleton / spinner)
- Error state handling
- Search debouncing and UX
- Filter bar usability
Files: tasks.astro
</task>

<task id="17-07" title="Kanban page UI audit">
Review kanban.astro:
- Drag-and-drop a11y (keyboard alternatives)
- Column rendering correctness
- Card priority visualization
- Custom lanes functionality
- Board filtering
- Mobile responsive layout
Files: kanban.astro
</task>

<task id="17-08" title="Table page UI audit">
Review table.astro:
- Inline editing a11y (focus management, save/cancel)
- Column sorting
- RICE filter functionality
- Custom fields column rendering
- Responsive behavior on narrow viewports
Files: table.astro
</task>

<task id="17-09" title="Layout + Task Detail + Command Palette audit">
Review Layout.astro:
- Skip-to-content link functionality
- Sidebar navigation a11y (keyboard, ARIA)
- Task detail modal: focus trap, ESC close, auto-save reliability
- Command palette: Ctrl+K, fuzzy search, keyboard navigation
- Toast notifications: ARIA live region, dismiss timing
- Connection status indicator accuracy
Files: Layout.astro
</task>

<task id="17-10" title="Settings page + Dashboard audit">
Review settings.astro, index.astro:
- Form validation UX (inline errors, required fields)
- Custom field CRUD flow
- Integration config sections
- Dashboard stats accuracy
- Quick actions functionality
Files: settings.astro, index.astro
</task>

## Wave 3: Cross-Cutting Audit (DDD + KCS + Compliance)

<task id="17-11" title="DDD boundary compliance">
Review bounded context boundaries:
- No deep cross-context imports
- Ubiquitous language consistency (task/board/label naming)
- Domain package isolation (domain-tasks, domain-auth, integration-core)
- API routes organized by domain
Files: all domain directories
</task>

<task id="17-12" title="KCS documentation accuracy">
Review all docs/kcs/*.md for:
- Accuracy against current implementation
- Missing documentation for Phase 16+18 additions
- Handoff doc alignment with execution evidence
- Decision records (ADRs) up to date
Files: docs/kcs/*.md, docs/decisions/*.md
</task>

## Verification Criteria

- `npx pnpm check` — 0 errors
- `npx pnpm --filter @meitheal/tests test` — all pass
- `npx pnpm --filter @meitheal/web perf:budget` — within limits
- `npx pnpm --filter @meitheal/web schema:drift` — no drift
- `npx astro build` — passes
- All 12 domain audit findings recorded
- All fixable findings resolved in this phase
- Unfixable findings documented as deferred with rationale
