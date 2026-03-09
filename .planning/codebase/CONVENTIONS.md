# Coding Conventions

> Last mapped: 2026-03-09 — v0.1.99

## File Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Files | kebab-case | `task-sync-service.ts` |
| Components | PascalCase | `NewTaskModal.astro` |
| CSS partials | `_` prefix | `_feedback.css` |
| Test specs | `*.spec.ts` | `ha-calendar-adapter.spec.ts` |
| Scripts | kebab-case | `schema-drift-check.mjs` |

## Code Style

| Rule | Value |
|------|-------|
| Semicolons | No |
| Quotes | Double `"` |
| Indent | 2 spaces |
| Trailing comma | ES5 |
| Line length | No hard limit |
| Module system | ESM (`"type": "module"`) |

## Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Functions | camelCase | `createTask()`, `resolveIngressContext()` |
| Types/Interfaces | PascalCase | `TaskAggregate`, `CalendarSyncState` |
| Constants | SCREAMING_SNAKE | `RATE_LIMIT`, `CACHE_VERSION` |
| DB columns | snake_case | `created_at`, `parent_id`, `recurrence_rule` |
| CSS classes | kebab-case | `bento-card`, `empty-state-icon` |
| API routes | kebab-case | `/api/tasks/[id]/comments` |
| Events | dot-separated | `task.created`, `sync.conflict.resolved` |

## Exports

- **Named exports only** — no `export default`
- Import order: Node builtins → Framework → External → Workspace → Relative
- Path alias: `@domains/` → `apps/web/src/domains/`

## API Response Pattern

```typescript
// Success
return apiJson({ tasks: rows })

// Error
return apiError("Failed to load tasks", 500)
```

All responses use discriminated unions: `{ ok: true, data } | { ok: false, errorCode }`.

## Error Handling

- API routes: `try/catch` with `apiError()` response
- Domain functions: Return `{ ok, error }` discriminated unions
- Logging: `createLogger()` from `@meitheal/domain-observability`
- Redaction: Secrets stripped by `defaultRedactionPatterns`

## SQL Convention

- Raw SQL via `client.execute()` with parameterized queries (`?`)
- Never interpolate user values into SQL strings
- Column names validated against allowlists for dynamic ORDER BY
- Schema managed in `ensureSchema()` — tables created on startup

## CSS Convention

- 17 partials imported via `global.css`
- Design tokens in `_tokens.css` (CSS custom properties)
- Responsive: mobile-first with breakpoints in `_responsive.css`
- Dark mode: `[data-theme="dark"]` selector
- Reduced motion: `@media (prefers-reduced-motion: reduce)`
- Tailwind utilities available but CSS partials preferred

## Component Patterns

- **Astro-first**: No React/Vue/Svelte. Interactivity via `<script is:inline>`
- **Page lifecycle**: `pageLifecycle` helper from `lib/page-lifecycle.ts` for ViewTransition-safe cleanup
- **AbortController**: Window listeners use signal-based cleanup
- **Fetch monkey-patching**: `Layout.astro` patches `window.fetch` to auto-prefix ingress path

## Logging Schema

Single JSON line per log entry (Loki-compatible):

```json
{
  "ts": "...",
  "level": "info",
  "event": "task.created",
  "domain": "tasks",
  "component": "task-api",
  "request_id": "...",
  "message": "...",
  "metadata": {}
}
```

- No high-cardinality labels (user IDs, task IDs in label position)
- Secrets redacted by default
