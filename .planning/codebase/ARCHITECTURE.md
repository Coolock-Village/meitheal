# Architecture

**Analysis Date:** 2026-02-28

## Pattern Overview

**Overall:** DDD monorepo with Astro SSR + domain packages

**Key Characteristics:**
- Domain-Driven Design with 5 bounded contexts as separate packages
- Astro SSR server mode with Node standalone adapter
- Event-driven architecture with domain events and idempotency
- Dual runtime: HA (Node + SQLite) and Cloud (Workers + D1)

## Layers

**Web Runtime (`apps/web/`):**
- Purpose: Astro SSR application — pages, API routes, middleware
- Location: `apps/web/src/`
- Contains: Pages, API endpoints, domain implementations, content schemas
- Depends on: Domain packages via `workspace:*`
- Used by: HA add-on runtime, browser clients

**Domain Packages (`packages/domain-*/`):**
- Purpose: Pure domain logic — infrastructure agnostic
- Location: `packages/domain-auth/`, `packages/domain-tasks/`, `packages/domain-strategy/`, `packages/domain-observability/`
- Contains: Types, interfaces, business logic, event definitions
- Depends on: Nothing external (pure TS)
- Used by: `apps/web`, `integration-core`

**Integration Core (`packages/integration-core/`):**
- Purpose: Calendar and HA service adapters
- Location: `packages/integration-core/src/`
- Contains: `CalendarIntegrationAdapter` interface, `HomeAssistantCalendarAdapter` class
- Depends on: Domain package types
- Used by: `apps/web` task-sync service

**API Layer (`apps/web/src/pages/api/`):**
- Purpose: REST endpoints for native and compat APIs
- Location: `apps/web/src/pages/api/`
- Contains: Native routes (`tasks/create`, `health`, `unfurl`, `integrations/calendar/confirmation`) and compat routes (`v1/*`)
- Depends on: Domain implementations in `apps/web/src/domains/`
- Used by: HA ingress, voice assistants, external clients

**Middleware (`apps/web/src/middleware.ts`):**
- Purpose: Ingress auth enforcement for HA
- Location: `apps/web/src/middleware.ts`
- Contains: Header validation, ingress path extraction, HASSIO token detection
- Depends on: `@domains/auth/ingress`
- Used by: All incoming requests

## Data Flow

**Task Creation with Calendar Sync:**

1. Client POSTs to `/api/tasks/create`
2. `createTaskWithFrameworkAndCalendarSync()` builds aggregate + domain events + calendar request
3. Persistence layer stores task, events, and integration attempt in SQLite
4. `HomeAssistantCalendarAdapter` calls HA `calendar/create_event` service
5. Confirmation stored in `calendar_confirmations` table
6. Audit trail entry written

**State Management:**
- Server-side SQLite via Drizzle ORM
- 5 tables: `tasks`, `domain_events`, `integration_attempts`, `calendar_confirmations`, `audit_trail`
- Idempotency via `idempotencyKey` on task aggregates

## Key Abstractions

**DomainEvent:**
- Purpose: Canonical event envelope for all domain events
- Examples: `packages/domain-tasks/src/vertical-slice.ts`
- Pattern: `{ eventId, eventType, occurredAt, requestId, payload }`

**CalendarIntegrationAdapter:**
- Purpose: Port for calendar service integration
- Examples: `packages/integration-core/src/index.ts`
- Pattern: Interface with `createEvent()` returning `CalendarResult`

**CreateTaskPlan:**
- Purpose: Aggregate of task + events + calendar request
- Examples: `packages/domain-tasks/src/vertical-slice.ts`
- Pattern: Command → Plan → Persist → Integrate

## Entry Points

**Astro Server:**
- Location: `apps/web/dist/server/entry.mjs` (built)
- Triggers: Node process start via `run.sh`
- Responsibilities: HTTP server, routing, SSR

**API Routes:**
- Location: `apps/web/src/pages/api/`
- Triggers: HTTP requests
- Responsibilities: Business logic execution, response formatting

**Health Endpoint:**
- Location: `apps/web/src/pages/api/health.ts`
- Triggers: Add-on healthcheck, monitoring
- Responsibilities: Runtime + DB readiness check

## Error Handling

**Strategy:** Typed discriminated unions (`CalendarResult = { ok: true } | { ok: false }`)

**Patterns:**
- `classifyError()` maps HTTP status codes to retryable/terminal states
- Middleware returns structured JSON errors with `missingHeaders`
- Logger redacts secrets/PII by default

## Cross-Cutting Concerns

**Logging:** Structured JSON to stdout via `domain-observability` logger (Loki-compatible)
**Validation:** Zod schemas for API input, config content schemas for YAML
**Authentication:** HA ingress headers + HASSIO token (native), env-based API tokens (compat)

---

*Architecture analysis: 2026-02-28*
