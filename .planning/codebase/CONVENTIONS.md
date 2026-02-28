# Coding Conventions

**Analysis Date:** 2026-02-28

## Naming Patterns

**Files:**
- Use kebab-case: `task-sync-service.ts`, `home-assistant-calendar.ts`
- Domain packages: `domain-<context>/src/index.ts` as public API
- Test specs: `<name>.spec.ts` or `<name>.spec.mjs`

**Functions:**
- Use camelCase: `createTask()`, `resolveIntegrationOutcome()`, `classifyError()`
- Factory pattern: `create*()` for constructors (`createLogger`, `createTask`)
- Resolver pattern: `resolve*()` for env/config resolution (`resolveHomeAssistantAuthFromEnv`)

**Variables:**
- Use camelCase: `calendarSyncState`, `idempotencyKey`
- Constants use camelCase (not UPPER_SNAKE): `defaultBudgets`, `defaultRedactionPatterns`

**Types:**
- Use PascalCase: `TaskAggregate`, `CalendarSyncState`, `DomainEvent`
- Interfaces prefixed with descriptive noun: `CreateTaskCommand`, `LoggerConfig`
- Discriminated unions: `CalendarSyncResult = { ok: true } | { ok: false }`

## Code Style

**Formatting:**
- No explicit Prettier/ESLint config detected — relies on Astro's `astro check`
- Semicolons: not used (no-semicolons style)
- Quotes: double quotes in imports
- Indentation: 2 spaces

**Linting:**
- `astro check` for type checking
- `tsc --noEmit` for test packages
- CI enforces both in `typecheck-and-tests` job

## Import Organization

**Order:**
1. Node.js builtins (`node:fs/promises`, `node:path`)
2. Framework imports (`astro`, `astro:content`)
3. External packages (`drizzle-orm`, `zod`, `undici`)
4. Workspace packages (`@meitheal/domain-tasks`, `@meitheal/integration-core`)
5. Local/relative imports (`./task`, `@domains/auth/ingress`)

**Path Aliases:**
- `@domains/` alias for `apps/web/src/domains/` (used in middleware)

## Error Handling

**Patterns:**
- Discriminated unions for results: `{ ok: true, ... } | { ok: false, errorCode, retryable }`
- `classifyError(status)` maps HTTP codes to retry semantics
- Try-catch with structured error responses (JSON with error/missingHeaders)
- `AbortController` for timeouts on external calls

## Logging

**Framework:** Custom structured JSON logger from `@meitheal/domain-observability`

**Patterns:**
- Single JSON object per line to stdout (Loki-compatible)
- Schema: `{ ts, level, event, domain, component, request_id, message, metadata }`
- Redact secrets by default using `defaultRedactionPatterns`
- Low-cardinality labels only (no user IDs, task IDs, URLs as labels)
- Audit events via `logger.audit()` method

## Comments

**When to Comment:**
- Inline comments for non-obvious behavior: `// Fallback to defaults for local dev`
- Section markers in middleware: `// For API routes that expect ingress context`

**JSDoc/TSDoc:**
- Not heavily used — types serve as documentation
- Interfaces have descriptive property names instead of JSDoc

## Function Design

**Size:** Small, focused functions (~10-30 lines)
**Parameters:** Command objects for complex inputs (`CreateTaskCommand`)
**Return Values:** Typed discriminated unions, never `any`

## Module Design

**Exports:** Named exports only (no default exports)
**Barrel Files:** `index.ts` in each package re-exports public API

---

*Convention analysis: 2026-02-28*
