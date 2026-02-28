# External Integrations

**Analysis Date:** 2026-02-28
**Commit:** 9b9f2ab

## Home Assistant Calendar

| Property | Value |
|----------|-------|
| Adapter | `HomeAssistantCalendarAdapter` in `integration-core/` |
| Auth | `SUPERVISOR_TOKEN` (auto) or `HA_BASE_URL` + `HA_TOKEN` |
| Endpoint | `POST /api/services/calendar/create_event` |
| Timeout | 8s, retryable on 429/5xx |
| Idempotency | `x-meitheal-idempotency-key` header |

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
| Tables | `tasks`, `domain_events`, `integration_attempts`, `calendar_confirmations`, `audit_trail` |
| Migrations | `apps/web/drizzle/migrations/` |

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
| `publish-addon-images.yml` | Tag `v*` | Multi-arch Docker |
| `live-ha-integration.yml` | Manual | Live HA calendar test |
| `live-vikunja-voice-assistant.yml` | Manual | Live compat validation |

## Secrets

All secrets are **environment-only** — never stored in YAML/config files.

---

*Integration audit: 2026-02-28 @ 9b9f2ab*
