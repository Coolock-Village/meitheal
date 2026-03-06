# Architecture

**Analysis Date:** 2026-03-06
**Version:** 0.1.69

## Pattern

**DDD monorepo** with Astro SSR + domain packages + event-driven integration.

| Aspect | Decision |
|--------|----------|
| Architecture | Domain-Driven Design, 7 bounded contexts |
| Runtime | Astro SSR (Node standalone, wrapped by `serve.mjs`) for HA; Workers adapter (skeleton) for Cloudflare |
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

### In-App Domains (`apps/web/src/domains/`)
- `auth/` — ingress detection (`ingress.ts`, `ingress-policy.ts`)
- `ha/` — HA WebSocket events, connection management
- `todo/` — HA todo list sync, status mapping
- `tasks/` — persistence, sync service
- `notifications/` — due-date reminder scheduler, notification dispatch
- `offline/` — SW registration (`sw-register.ts`), PWA lifecycle
- `integrations/vikunja-compat/` — Vikunja compatibility layer

### HA Custom Component (Python, `integrations/home-assistant/custom_components/meitheal/`)
- Config flow integration with Supervisor auto-discovery (`async_step_hassio`)
- `DataUpdateCoordinator` for 30s polling of task data
- 4 entities: `todo.meitheal_tasks`, `sensor.meitheal_active_tasks`, `sensor.meitheal_overdue_tasks`, `sensor.meitheal_total_tasks`
- 5 services: `create_task`, `complete_task`, `sync_todo`, `search_tasks`, `get_overdue_tasks`
- LLM API surface (optional, via `conversation` after_dependency): exposes task tools to voice assistants
- `hassio` as hard dependency for Supervisor discovery

### Integration Core (`packages/integration-core/`)
- `CalendarIntegrationAdapter` interface + `HomeAssistantCalendarAdapter` implementation
- Error classification, timeout handling, retry semantics

### API Layer (`apps/web/src/pages/api/`)
- **Native:** `tasks/create`, `health`, `unfurl`, `integrations/calendar/confirmation`
- **Compat (Vikunja v1):** 7 routes under `/api/v1/` — projects, tasks, labels, users, assignees, projectusers

### Middleware (`apps/web/src/middleware.ts`)
- Ingress path rewriting for HA
- CSP headers, CSRF validation, rate limiting
- Regional settings (timezone, weekStart, dateFormat)

### Ingress Wrapper (`apps/web/scripts/serve.mjs`)
- HTTP server that wraps Astro’s handler
- Normalizes `//` → `/` before Astro routing (prevents 301 redirect loops)
- Sets `ASTRO_NODE_AUTOSTART=disabled` to own the server

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
| `notification.dispatched` | Task notification sent | taskId, channel, target |
| `notification.due_reminder` | Due-date reminder fired | taskId, minutesUntilDue |

## Error Handling

- Discriminated unions: `{ ok: true } | { ok: false, errorCode, retryable }`
- `classifyError(status)` maps HTTP codes to retry semantics
- `AbortController` timeouts on external calls
- Structured JSON error responses from all API routes

## Styling Architecture

- **Entry file:** `src/styles/global.css` — `@tailwind` directives + 14 `@import` partials
- **Partials:** `_tokens.css`, `_base.css`, `_layout.css`, `_forms.css`, `_buttons.css`, `_cards.css`, `_tasks.css`, `_kanban.css`, `_table.css`, `_feedback.css`, `_search.css`, `_modal.css`, `_responsive.css`, `_utilities.css`
- **Convention:** `_` prefix = not standalone. Domain-scoped by DDD bounded context
- **Tailwind:** `@layer base/components/utilities` within partials. `@tailwind` directives in entry file only
- **Mostly no Astro scoping:** Shared classes (`.btn`, `.card`, `.form-input`) span all pages
- **Exception:** `Sidebar.astro` has scoped mobile responsive CSS (`@media max-width:768px`) to override its own scoped base styles at matching specificity. Global CSS cannot reliably override Astro scoped styles due to `[data-astro-cid-xxx]` attribute selector specificity.

## Settings Architecture

- Tab-based sidebar: General, Integrations, AI Agents, About, Help
- Each tab is a standalone Astro component (`SettingsGeneral.astro`, `SettingsIntegrations.astro`, etc.)
- Integration cards with auto-detect HA connection (WebSocket singleton)
- Calendar sync toggle persisted to SQLite via `/api/integrations/calendar/settings`
- Calendar sync settings (`calendar_sync_enabled`, `calendar_write_back`) saved + sync API called on save
- ViewTransitions disabled behind HA ingress (prevents redirect loops)
- Ingress state persistence: saves route + scroll to `sessionStorage`, restores within 60s after iframe recreation (`lib/ingress-state-persistence.ts`)
- All `window.location.href` calls prepend `window.__ingress_path` for HA ingress compatibility (keyboard shortcuts, command palette, CSV export)

---

*Architecture analysis: 2026-03-06 — v0.1.69 notification system audit*
