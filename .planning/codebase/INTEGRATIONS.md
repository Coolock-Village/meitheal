# External Integrations

**Analysis Date:** 2026-03-02
**Commit:** df48f27

## Home Assistant Calendar

| Property | Value |
|----------|-------|
| Adapter | `HomeAssistantCalendarAdapter` in `integration-core/` |
| Bridge | `calendar-bridge.ts` — bidirectional sync (HA→tasks, tasks→HA) |
| Auth | `SUPERVISOR_TOKEN` (auto) or `HA_BASE_URL` + `HA_TOKEN` |
| Endpoint | `POST /api/services/calendar/create_event` |
| API Routes | `GET/POST /api/ha/calendars` |
| Sync Range | Past 7 days → next 30 days |
| Dedup | `calendar_confirmations` table (keyed by `provider_event_id`) |
| Write-back | Pushes task due dates as HA events prefixed `[Meitheal]` |
| Timeout | 8s, retryable on 429/5xx |
| Idempotency | `x-meitheal-idempotency-key` header |
| Settings UI | Settings → Integrations → Calendar Sync (dynamic status badge) |

## Home Assistant Todo Sync

| Property | Value |
|----------|-------|
| Domain | `domains/todo/` bounded context |
| Bridge | `todo-bridge.ts` — bidirectional sync via WebSocket |
| Status Mapper | `todo-status-mapper.ts` — HA ↔ Meitheal status/field mapping |
| Auth | `SUPERVISOR_TOKEN` (auto) |
| Real-time | `todo/item/subscribe` WebSocket subscription |
| Services | `getTodoItems`, `addTodoItem`, `updateTodoItem`, `removeTodoItem`, `removeTodoCompletedItems`, `moveTodoItem`, `subscribeTodoItems` |
| API Routes | `GET/POST/PUT/DELETE /api/todo/items`, `GET/POST /api/todo/sync`, `GET /api/todo` |
| Sync Control | Opt-in via Settings → Integrations → Todo Sync toggle |
| DB | `todo_sync_confirmations` table (migration `0002_todo_sync.sql`) |
| Status Mapping | `needs_action` ↔ `todo`/`in_progress`, `completed` ↔ `done` |

## Vikunja Compatibility API

| Property | Value |
|----------|-------|
| Surface | 7 REST routes under `/api/v1/` |
| Auth | `MEITHEAL_VIKUNJA_API_TOKEN(S)` bearer tokens |
| Observability | Structured logging via `compat-logger.ts` |
| Calendar sync | Optional, toggled by `MEITHEAL_COMPAT_CALENDAR_SYNC_MODE` |

**Compat Routes:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/projects` | List projects |
| PUT | `/api/v1/projects/:id/tasks` | Create task |
| GET | `/api/v1/projects/:id/projectusers` | List project users |
| GET | `/api/v1/labels` | List labels |
| PUT | `/api/v1/labels` | Create label |
| PUT | `/api/v1/tasks/:id/labels` | Attach label |
| PUT | `/api/v1/tasks/:id/assignees` | Assign user |
| GET | `/api/v1/users` | Search users |

## Database

| Property | Value |
|----------|-------|
| Engine | SQLite via libSQL |
| ORM | Drizzle ORM 0.45 |
| Connection | `MEITHEAL_DB_URL` (default: `file:/data/meitheal.db`) |
| Tables | `tasks`, `domain_events`, `integration_attempts`, `calendar_confirmations`, `todo_sync_confirmations`, `audit_trail` |
| Migrations | `apps/web/drizzle/migrations/` (0001-0002) |

## Observability Pipeline

```
app stdout (JSON) → HA journal → Grafana Alloy → Loki → Grafana
```

**Dashboards:**
- `addons/meitheal-hub/rootfs/etc/grafana/dashboards/compat-api.json` — compat API metrics

**Log labels (low-cardinality only):**
- `service`, `domain`, `env`, `host`, `addon`, `level`

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | 6 required jobs |
| `publish-addon-images.yml` | Tag `v*` or manual dispatch | Multi-arch Docker (GHCR + Docker Hub) |
| `live-ha-integration.yml` | Manual | Live HA calendar test |
| `live-vikunja-voice-assistant.yml` | Manual | Live compat validation |

## Secrets

All secrets are **environment-only** — never stored in YAML/config files.

| Secret | Where | Purpose |
|--------|-------|---------|
| `DOCKERHUB_USERNAME` | GitHub repo secrets | Docker Hub push (`coolockvillage`) |
| `DOCKERHUB_TOKEN` | GitHub repo secrets | Docker Hub auth |
| `SUPERVISOR_TOKEN` | HA Supervisor (auto) | HA API access |
| `MEITHEAL_VIKUNJA_API_TOKEN(S)` | Environment | Vikunja compat auth |

## Docker Hub

| Image | Tags |
|-------|------|
| `coolockvillage/meitheal-hub-amd64` | `0.3.0`, `latest` |
| `coolockvillage/meitheal-hub-aarch64` | `0.3.0`, `latest` |

---

*Integration audit: 2026-03-02 @ df48f27*
