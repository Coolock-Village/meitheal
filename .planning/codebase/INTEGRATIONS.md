# External Integrations

**Analysis Date:** 2026-03-04
**Version:** 0.1.55

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

## HA Custom Component (Python)

| Property | Value |
|----------|-------|
| Path | `integrations/home-assistant/custom_components/meitheal/` |
| Type | `hub` integration with config flow |
| Discovery | Supervisor Discovery API — zero-touch setup via `async_step_hassio` |
| Device | All entities grouped under "Meitheal" device (manufacturer: Coolock Village, model: Task Engine) |
| Entities | `todo.meitheal_tasks`, `sensor.meitheal_active_tasks`, `sensor.meitheal_overdue_tasks`, `sensor.meitheal_total_tasks` |
| Services | `meitheal.create_task`, `meitheal.complete_task`, `meitheal.sync_todo`, `meitheal.search_tasks`, `meitheal.get_overdue_tasks` |
| Communication | REST API to addon at `http://{host}:{port}/api/tasks` |
| Polling | 30s via `DataUpdateCoordinator` |
| Auto-install | Addon copies component to `/homeassistant/custom_components/` at boot |
| Auto-setup | Addon calls `POST /discovery` on Supervisor API → triggers `async_step_hassio()` in config_flow |
| Config | Auto-discovered on addon start; manual fallback: Settings → Devices & Services → Add Integration → Meitheal |
| Icon | `icon.png` bundled in component directory |

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
| Tables | `tasks`, `boards`, `lanes`, `saved_filters`, `reminders`, `domain_events`, `integration_attempts`, `calendar_confirmations`, `todo_sync_confirmations`, `audit_trail` |
| Migrations | `apps/web/drizzle/migrations/` (0001-0003) |

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

## Docker Images

| Image | Tags |
|-------|------|
| `ghcr.io/coolock-village/meitheal-amd64` | `0.2.6`, `latest` |
| `ghcr.io/coolock-village/meitheal-aarch64` | `0.2.6`, `latest` |
| `coolockvillage/meitheal-amd64` | `0.2.6`, `latest` |
| `coolockvillage/meitheal-aarch64` | `0.2.6`, `latest` |

---

## Settings UI Patterns (Phase 57)

### Explainer Dialog

Native `<dialog>` element (`#integration-explainer-dialog`). Content is defined in the inline `EXPLAINER_CONTENT` map (keyed by integration name). Opened by `.info-btn[data-explainer]` buttons on card headers. Init guard via `dialog.dataset.explainerInit`. Backdrop click + × button close.

### Mode Tabs

`.mode-tabs` container with `.mode-tab` buttons. Active state: `.mode-tab--active`. Used by n8n/Node-RED for "HA Addon (auto)" vs "Standalone" mode. Mode persists to `localStorage` key `meitheal:n8n-mode`.

### Auto-Detection

Pattern: fetch `/api/ha/addons` → search by addon slug → show callout, hide manual fields, auto-fill URL. Used by Grocy (`a0d7b954_grocy` slug). Node-RED uses `a0d7b954_nodered`. Both callout containers use `aria-live="polite"` for screen reader updates.

### Calendar Entity Dropdown

`<select id="cal-entity">` populated by `initCalendarDropdown()` from `/api/ha/calendars`. Falls back to "Custom entity…" option revealing manual `<input id="cal-entity-manual">`. CalDAV settings in collapsible `<details class="caldav-section">`.

### Callout Links

`.callout-link[data-tab]` elements trigger settings tab switches via `initCalloutLinks()`. Used in webhook differentiation callout to jump to "Agents & AI" tab.

## HA Ingress Gotchas

Known pitfalls when running behind HA Supervisor ingress.

### Static Assets Bypass Middleware

The Astro Node adapter serves `dist/client/_astro/*` as static files **outside** the middleware pipeline. This means:

- CSS `url()` paths are **not** rewritten by the ingress rewriter at runtime
- Any absolute path in a static file (e.g. `url(/_astro/font.woff2)`) resolves against `ha.home.arpa:8123/` instead of the ingress base

**Fix pattern:** Use build-time transformations (Vite plugins) to make paths relative. See `fontsource-relative-paths` plugin in `astro.config.mjs`.

### Healthcheck Has No Ingress Headers

The container healthcheck (`/api/health`) runs inside the Docker network with `SUPERVISOR_TOKEN` but no `x-ingress-path` header. Middleware should suppress ingress-missing warnings for healthcheck paths to avoid log spam (~2,880 warnings/day).

### Ingress Path Has Trailing Slashes

The `x-ingress-path` header may contain trailing slashes (`/api/hassio_ingress/{token}//`). The `normalizePathLikeValue()` function in `auth/ingress.ts` strips these, but startup logs may show the raw value.

### Devcontainer vs Local Build on Bazzite

The HA devcontainer (`ghcr.io/home-assistant/devcontainer:2-addons`) requires Docker-in-Docker with real root — **does not work with rootless Podman**. Inner containers fail with `open sysctl kernel.domainname file: permission denied`.

**Working alternative — Local Build + Local Run** (per HA docs):

```bash
# Build
podman build --build-arg BUILD_FROM="ghcr.io/home-assistant/amd64-base:latest" \
  -t local/meitheal-hub -f meitheal-hub/Dockerfile .

# Run standalone (no Supervisor)
mkdir -p /tmp/meitheal_test_data
podman run --rm -v /tmp/meitheal_test_data:/data:Z -p 4600:3000 local/meitheal-hub
```

Addon runs on `http://127.0.0.1:4600` in standalone mode. "Failed to get addon config from Supervisor API" is expected.

---

*Integration audit: 2026-03-04 — Phase 57b updated*
