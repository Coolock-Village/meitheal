# Coding Conventions

**Analysis Date:** 2026-03-03
**Version:** 0.2.6

## Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Files | kebab-case | `task-sync-service.ts`, `compat-logger.ts` |
| Functions | camelCase | `createTask()`, `resolveIntegrationOutcome()` |
| Factory functions | `create*()` | `createLogger()`, `createTask()` |
| Resolvers | `resolve*()` | `resolveHomeAssistantAuthFromEnv()` |
| Types/Interfaces | PascalCase | `TaskAggregate`, `CalendarSyncState` |
| Constants | camelCase | `defaultBudgets`, `defaultRedactionPatterns` |
| Test specs | `<name>.spec.ts` | `ha-calendar-adapter.spec.ts` |

## Code Style

- **Semicolons:** no
- **Quotes:** double
- **Indent:** 2 spaces
- **Linting:** `astro check` + `tsc --noEmit`
- **Formatter:** none explicit (Astro defaults)

## Import Order

1. Node builtins (`node:fs/promises`, `node:path`)
2. Framework (`astro`, `astro:content`)
3. External packages (`drizzle-orm`, `zod`)
4. Workspace packages (`@meitheal/domain-tasks`)
5. Local/relative (`./task`, `@domains/auth/ingress`)

**Path alias:** `@domains/` → `apps/web/src/domains/`

## Patterns

| Pattern | Usage | Example |
|---------|-------|---------|
| Discriminated unions | API results | `{ ok: true } \| { ok: false, errorCode }` |
| Command objects | Complex inputs | `CreateTaskCommand` |
| Named exports only | All modules | No default exports |
| Barrel files | Package APIs | `index.ts` re-exports |
| Error classification | HTTP→retry semantics | `classifyError(status)` |
| Structured logging | Compat routes | `logCompatRequest({ route, method, status })` |
| AbortController | External call timeouts | `HomeAssistantCalendarAdapter` |
| Global fetch intercept | Ingress URL prefixing | `Layout.astro` `<head>` inline script |

## ⚠️ Gotchas

| Gotcha | Detail |
|--------|--------|
| **Do NOT wrap client-side `fetch()` with `apiUrl()`** | `Layout.astro` (lines 68-117) has an inline `<script>` that monkey-patches `window.fetch` to auto-prefix `window.__ingress_path` on ALL root-relative URLs (strings starting with `/`). Using `apiUrl()` on top of this **double-prefixes** the path. The `apiUrl()` helper in `lib/ingress-fetch.ts` exists only for non-fetch URL construction (e.g. `<a href>` in JS, SSE URLs). |
| **`getHAConnectionStatus()` is passive** | It only reads the in-memory `connection` singleton — it does NOT attempt to connect. Always call `await getHAConnection()` first if you need to ensure the WebSocket is established. |

## Logging Convention

- Single JSON object per line to stdout (Loki-compatible)
- Schema: `{ ts, level, event, domain, component, request_id, message, metadata }`
- Redact secrets by default via `defaultRedactionPatterns`
- Compat routes use `compat-logger.ts` for consistent structured logging

---

*Convention analysis: 2026-03-03 — v0.2.6*
