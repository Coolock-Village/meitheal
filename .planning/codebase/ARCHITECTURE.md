# Architecture

> Last mapped: 2026-03-09 — v0.1.99

## Pattern

**DDD monorepo** with **Astro SSR** runtime, **domain packages** for pure business logic, **event-driven integration** with Home Assistant.

```
┌───────────────────────────────────────────────────────┐
│                   HA Supervisor                        │
│  ┌──────────┐  X-Ingress-Path  ┌────────────────────┐ │
│  │  Ingress │ ────────────────→│    serve.mjs       │ │
│  │  Proxy   │                  │ (normalize // → /) │ │
│  └──────────┘                  └────────┬───────────┘ │
│                                         │             │
│  ┌──────────────────────────────────────▼───────────┐ │
│  │              Astro SSR Runtime                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │ │
│  │  │middleware │  │  Pages   │  │  API Routes    │  │ │
│  │  │(security,│  │  (.astro)│  │  (/api/*)      │  │ │
│  │  │ ingress) │  │  12 pages│  │  64 endpoints  │  │ │
│  │  └────┬─────┘  └────┬─────┘  └──────┬─────────┘  │ │
│  │       │              │               │            │ │
│  │  ┌────▼──────────────▼───────────────▼──────────┐ │ │
│  │  │           In-App Domains (17)                 │ │ │
│  │  │  ha/ todo/ tasks/ calendar/ gamification/     │ │ │
│  │  │  labels/ notifications/ ai/ offline/ grocy/   │ │ │
│  │  └──────────────────┬───────────────────────────┘ │ │
│  │                     │                             │ │
│  │  ┌──────────────────▼───────────────────────────┐ │ │
│  │  │         Workspace Packages (5)                │ │ │
│  │  │  domain-tasks  domain-auth  domain-strategy   │ │ │
│  │  │  domain-observability  integration-core       │ │ │
│  │  └──────────────────┬───────────────────────────┘ │ │
│  │                     │                             │ │
│  │               ┌─────▼─────┐                       │ │
│  │               │  SQLite   │                       │ │
│  │               │ (libSQL)  │                       │ │
│  │               └───────────┘                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ HA WS    │  │ HA REST  │  │ Calendar (CalDAV)    │ │
│  │(entities)│  │(services)│  │ (two-way sync)       │ │
│  └──────────┘  └──────────┘  └──────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

## Layers

### 1. Ingress Layer
- **`scripts/serve.mjs`** — Custom HTTP server wrapping Astro handler. Normalizes `//` → `/`, injects `X-Ingress-Path`.
- **`src/middleware.ts`** — Pipeline: rate limiting → CSRF → security headers (CSP/HSTS) → ingress HTML rewriting → user context injection → DB init.

### 2. Presentation Layer
- **12 pages**: `index` (dashboard), `kanban`, `table`, `tasks`, `today`, `upcoming`, `calendar`, `gantt`, `settings`, `offline`, `404`, `500`
- **34 Astro components**: `layout/`, `tasks/`, `settings/`, `gamification/`, `ha/`, `pwa/`, `ui/`
- **`Layout.astro`** — Master layout: sidebar, command palette, keyboard shortcuts, health checks, fetch monkey-patching for ingress

### 3. API Layer
- **64 API routes** in `src/pages/api/`
- Groups: `tasks/`, `boards/`, `lanes/`, `labels/`, `ha/`, `integrations/`, `export/`, `a2a/`, `v1/`, `todo/`, `grocy/`, `gamification`, `users/`
- Response helpers: `apiJson()` / `apiError()` from `lib/api-response.ts`
- Structured logging via `@meitheal/domain-observability`

### 4. Domain Layer (In-App)
17 bounded contexts in `src/domains/`:

| Context | Key Files | Responsibility |
|---------|-----------|---------------|
| `ha/` | `ha-connection.ts`, `ha-entities.ts`, `ha-events.ts`, `ha-services.ts`, `ha-users.ts`, `ha-startup.ts` | HA WebSocket, entity state, services |
| `todo/` | `todo-bridge.ts`, `todo-status-mapper.ts` | HA todo list bridge |
| `tasks/` | `persistence/store.ts`, `recurrence.ts`, `task-sync-service.ts` | DB schema, task persistence, sync |
| `calendar/` | `caldav-client.ts`, `calendar-bridge.ts` | CalDAV sync |
| `labels/` | `label-store.ts`, `label-color-resolver.ts` | Labels CRUD + color |
| `gamification/` | `index.ts`, `streak-tracker.ts` | XP engine, streaks |
| `notifications/` | `due-date-reminders.ts` | Overdue alerts |
| `ai/` | `ai-context-service.ts`, `ha-assist-service.ts` | HA AI Assist |
| `offline/` | `offline-store.ts`, `sync-engine.ts`, `tab-sync.ts` | PWA offline |
| `auth/` | `ingress-policy.ts`, `ingress.ts` | Ingress detection |
| `grocy/` | `grocy-bridge.ts`, `grocy-mapper.ts` | Grocy integration |

### 5. Domain Packages
| Package | Key Exports |
|---------|-------------|
| `domain-tasks` | `TaskAggregate`, vertical slice patterns |
| `domain-auth` | CSRF validation, session policy |
| `domain-strategy` | `calculateRICE()`, strategic evaluation |
| `domain-observability` | `createLogger()`, `defaultRedactionPatterns` |
| `integration-core` | Calendar adapter, webhook emitter, A2A handler, rate limiter |

### 6. Persistence
- SQLite via `@libsql/client` — single-file database
- Schema in `src/domains/tasks/persistence/store.ts` — `ensureSchema()` on startup
- 14+ tables with 15+ indexes
- Migrations via `scripts/migrate.mjs`

## Data Flow

### Task Creation
```
Client → POST /api/tasks/create → validate (zod) → sanitize
  → INSERT tasks → emit domain event → webhook dispatch
  → HA calendar sync (if enabled) → return task JSON
```

### HA Integration
```
Middleware startup → initHAIntegrations()
  → WebSocket connect → subscribe to state changes
  → Calendar entity discovery → two-way sync
```

### Ingress Request
```
HA Supervisor → serve.mjs (normalize //) → Astro handler
  → middleware (rate limit → CSRF → context → DB)
  → page/API route → middleware (rewrite HTML)
  → response to HA iframe
```

## Key Design Decisions

1. **Astro SSR, not SPA** — Server-rendered with `is:inline` scripts. No client framework.
2. **Raw SQL, not ORM queries** — `client.execute()` with parameterized queries. Drizzle for schema only.
3. **Named exports only** — No default exports anywhere.
4. **HA handles auth** — Trusts `X-Hassio-User-ID` and `X-Ingress-Path` headers.
5. **Ingress-first** — All URL handling accounts for ingress prefix across 3 layers.
6. **Domain events** — Task mutations → events → webhooks → n8n/HA automations.
