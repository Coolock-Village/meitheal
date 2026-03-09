# Concerns & Technical Debt

> Last mapped: 2026-03-09 — v0.1.99

## P0 — Critical

### Inline SQL in API Routes
- **Files**: All 64 API routes in `pages/api/`
- **Issue**: SQL queries are written inline in API route handlers instead of being encapsulated in domain packages
- **Risk**: Duplication, inconsistent query patterns, hard to audit
- **Fix**: Migrate to `@meitheal/domain-tasks` query functions

### Large Page Files
- **Files**: `kanban.astro` (~1700 lines), `settings.astro` (~2200 lines), `table.astro` (~1000 lines), `index.astro` (~600 lines)
- **Issue**: Mixing Astro templates, CSS, and large inline scripts
- **Risk**: Hard to maintain, test, and review
- **Fix**: Extract inline scripts to separate `.ts` files, extract sub-components

## P1 — High

### Missing `is:inline` Script Tests
- All client-side interactivity is in `<script is:inline>` blocks within `.astro` files
- These are invisible to TypeScript and untestable in unit tests
- Risk: Regressions in kanban drag-drop, table sorting, command palette

### Partial Subtask/Recurrence/Checklist UI
- `parent_id`, `recurrence_rule`, `checklists` columns exist in DB
- API supports creating/querying with these fields
- **No UI** for: tree/indent view, recurrence picker, inline checklists
- Users can't access these features without API calls

### Version Sync is Manual
- Three files must stay in sync: `config.yaml`, `run.sh`, `sw.js`
- No automated validation or build hook to enforce
- Risk: Mismatched versions between SW cache and backend

## P2 — Medium

### Drizzle ORM Unused
- Drizzle is a dependency but **not used for queries**
- All SQL is raw `client.execute()` with hand-written queries
- The `drizzle/` directory and `drizzle-kit` are present but schema is managed in `ensureSchema()`
- Consider: Remove drizzle deps if not planning to adopt, or migrate to Drizzle queries

### Empty Domain Packages
- `domains/frameworks/`, `domains/observability/`, `domains/strategy/` are **empty directories**
- Logic lives in workspace packages (`packages/domain-strategy/`) instead
- These should be removed or populated

### CSS @apply Lint Warnings
- `_feedback.css` uses `@apply` which IDE CSS linters flag as "Unknown at rule"
- These work at build time (Tailwind processes them) but create noise
- 5 persistent lint warnings

### Layout.astro Complexity
- `Layout.astro` handles: sidebar, navigation, command palette, keyboard shortcuts, health checks, fetch patching, focus traps, theme management
- Single file responsibility overload — should be decomposed

## P3 — Low

### Dead Route: `/api/reminders`
- `pages/api/reminders.ts` exists but may not be wired to any UI
- Due-date reminders are in `domains/notifications/due-date-reminders.ts`
- Need to verify if this route is actively used

### No Rate Limit on Export Routes
- `/api/export/database.sqlite` serves the full DB file
- No rate limiting beyond the global 120/min
- Large file export should have stricter limits

### Service Worker Version Fallback
- `sw.js` hardcodes `CACHE_VERSION = "0.1.99"` as fallback
- Dynamic version comes from `/version.json` at install
- If both fail, stale cache could persist indefinitely

### `apps/api/` (Cloudflare Workers) is Inactive
- Has `package.json`, `src/`, migrations, but not used in production
- Not integrated into CI pipeline
- Future: May be used for Cloudflare D1 edge deployment

## P4 — Deferred

### No i18n Translation Files
- `lib/locale.ts` has a translation system
- `meitheal-hub/translations/en.yaml` exists for addon
- But the actual UI translations may be incomplete or hardcoded

### PWA Background Sync
- `sync-engine.ts`, `sync-lock.ts`, `tab-sync.ts` exist
- IndexedDB offline store is implemented
- But: no visual Queue indicator in UI, no conflict resolution UI
- Background sync tag registered but sync execution is untested

### `window.__healthIntervalId` Pattern
- Health check interval uses `window.__healthIntervalId` guard
- Prevents accumulation but still runs outside page lifecycle
- Could leak on full page teardown (not ViewTransition)

## Security Notes

### ✅ Good
- All SQL uses parameterized queries (`?` placeholders)
- `sanitize-html` used for user HTML content
- XSS vectors fixed (innerHTML → DOM API in kanban, index)
- Rate limiting: 120/req per minute
- CSRF protection in middleware
- CSP headers set
- Secrets redacted in logs

### ⚠️ Watch
- No authentication layer — relies entirely on HA Supervisor headers
- In standalone mode (no HA), all routes are accessible without auth
- Export routes serve raw data without additional access control
