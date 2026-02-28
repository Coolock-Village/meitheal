# Architecture

**Analysis Date:** 2026-02-28
**Commit:** 9b9f2ab

## Pattern

**DDD monorepo** with Astro SSR + domain packages + event-driven integration.

| Aspect | Decision |
|--------|----------|
| Architecture | Domain-Driven Design, 5 bounded contexts |
| Runtime | Astro SSR (Node standalone) for HA; Workers adapter (skeleton) for Cloudflare |
| Data | SQLite via Drizzle ORM, libSQL driver |
| Events | Domain events with idempotency keys and request tracing |
| Integration | Adapter pattern via `CalendarIntegrationAdapter` interface |

## Layers

### Web Runtime (`apps/web/`)
- Astro SSR app — pages, API routes, middleware
- Depends on domain packages via `workspace:*`
- 22 source files in `apps/web/src/`

### Domain Packages (`packages/domain-*/`)
- Pure domain logic — infrastructure agnostic
- 4 packages: `domain-auth`, `domain-tasks`, `domain-strategy`, `domain-observability`
- Used by `apps/web` and `integration-core`

### Integration Core (`packages/integration-core/`)
- `CalendarIntegrationAdapter` interface + `HomeAssistantCalendarAdapter` implementation
- Error classification, timeout handling, retry semantics

### API Layer (`apps/web/src/pages/api/`)
- **Native:** `tasks/create`, `health`, `unfurl`, `integrations/calendar/confirmation`
- **Compat (Vikunja v1):** 7 routes under `/api/v1/` — projects, tasks, labels, users, assignees, projectusers

### Middleware (`apps/web/src/middleware.ts`)
- Ingress auth enforcement for HA
- Required header validation, HASSIO token detection

### Observability (`apps/web/src/domains/integrations/vikunja-compat/compat-logger.ts`)
- Structured request logging for all compat routes
- Emits `compat.request.completed` events with route/method/status/duration/error

## Data Flow: Task Creation with Calendar Sync

```
POST /api/tasks/create
  → createTaskWithFrameworkAndCalendarSync() — builds aggregate + events + calendar request
  → Persist: task, domain_events, integration_attempt → SQLite
  → HomeAssistantCalendarAdapter.createEvent() → HA calendar/create_event
  → Persist: calendar_confirmation → SQLite
  → Audit trail entry
```

## Key Abstractions

| Abstraction | Purpose | Location |
|-------------|---------|----------|
| `DomainEvent<T>` | Canonical event envelope | `domain-tasks/src/vertical-slice.ts` |
| `CalendarIntegrationAdapter` | Calendar service port | `integration-core/src/index.ts` |
| `CreateTaskPlan` | Task + events + calendar request aggregate | `domain-tasks/src/vertical-slice.ts` |
| `CalendarSyncResult` | Discriminated union for sync outcomes | `domain-tasks/src/vertical-slice.ts` |
| `CompatRequestLog` | Structured log entry for compat API | `vikunja-compat/compat-logger.ts` |

## Canonical Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `task.created` | Task creation | taskId, title, frameworkPayload |
| `framework.score.applied` | Framework fields applied | taskId, frameworkPayload |
| `integration.sync.requested` | Calendar sync initiated | taskId, integration, idempotencyKey |
| `integration.sync.completed` | Calendar sync result | taskId, confirmationId/errorCode |
| `compat.request.completed` | Compat API request finished | route, method, status, duration |

## Error Handling

- Discriminated unions: `{ ok: true } | { ok: false, errorCode, retryable }`
- `classifyError(status)` maps HTTP codes to retry semantics
- `AbortController` timeouts on external calls
- Structured JSON error responses from all API routes

---

*Architecture analysis: 2026-02-28 @ 9b9f2ab*
