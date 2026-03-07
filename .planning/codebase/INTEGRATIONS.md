# External Integrations

**Analysis Date:** 2026-03-06
**Version:** 0.3.0

## Home Assistant Calendar

| Property | Value |
|----------|-------|
| Adapter | `HomeAssistantCalendarAdapter` in `integration-core/` |
| Bridge | `calendar-bridge.ts` — directional sync (HA↔tasks) with per-entity mode |
| Auth | `SUPERVISOR_TOKEN` (auto) or `HA_BASE_URL` + `HA_TOKEN` |
| Endpoint | `POST /api/services/calendar/create_event` |
| API Routes | `GET/POST /api/ha/calendars`, `GET/POST /api/integrations/calendar/sync` |
| Sync Direction | Per-entity `syncMode`: `import` (HA→Meitheal), `export` (Meitheal→HA), `bidirectional` (both). Default: `bidirectional` |
| Direction Storage | `calendar_sync_mode` (global default) + `calendar_sync_modes` (per-entity JSON map: `{entity_id: mode}`) |
| Sync Range | Past 7 days → next 30 days |
| Dedup | `calendar_confirmations` table (keyed by `provider_event_id`), `[Meitheal]` prefix loop prevention |
| Write-back | Pushes task due dates as HA events prefixed `[Meitheal]`, description includes "Added from Meitheal" attribution. Only active for export/bidirectional modes |
| Multi-select | Toggle cards per calendar entity with inline direction selector; saved as `calendar_entities` JSON array |
| CPU Optimization | Export-only entities skip polling, entity-change subscription, and initial sync (push-on-save only) |
| Timeout | 8s, retryable on 429/5xx |
| Idempotency | `x-meitheal-idempotency-key` header |
| Settings UI | Settings → Integrations → Calendar Sync (enable/disable all, count badge, global + per-card direction selector, explainer dialog) |
| Sync metadata | Tracks `lastSyncAt`, `lastSyncEventCount`, `lastSyncError`, `syncMode` |

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
| Sync Control | Opt-in via Settings → Integrations → Todo Sync toggle cards (multi-entity) |
| Multi-entity | Toggle cards per todo entity; saved as `todo_entities` JSON array |
| Attribution | Outbound pushes include "Added from Meitheal" in description |
| DB | `todo_sync_confirmations` table (migration `0002_todo_sync.sql`) |
| Status Mapping | `needs_action` ↔ `todo`/`in_progress`, `completed` ↔ `done` |

## HA Custom Component (Python)

| Property | Value |
|----------|-------|
| Path | `integrations/home-assistant/custom_components/meitheal/` |
| Type | `hub` integration with config flow |
| Discovery | Supervisor Discovery API — zero-touch setup via `async_step_hassio`, 3-attempt retry with 5s delay |
| Device Registry | Auto-creates device entry (manufacturer: Coolock Village, model: Task Engine, entry_type: SERVICE) |
| Hostname Fix | Underscores→hyphens conversion for Docker DNS resolution (`868b2fee_meitheal` → `868b2fee-meitheal`) |
| Entities | `todo.meitheal_tasks`, `sensor.meitheal_active_tasks`, `sensor.meitheal_overdue_tasks`, `sensor.meitheal_total_tasks` |
| Services | `meitheal.create_task`, `meitheal.complete_task`, `meitheal.sync_todo`, `meitheal.search_tasks`, `meitheal.get_overdue_tasks`, `meitheal.notify_overdue` |
| LLM Tools | 10: `search_tasks`, `create_task`, `complete_task`, `delete_task`, `update_task`, `get_overdue_tasks`, `get_todays_tasks`, `get_task_summary`, `get_upcoming_events`, `daily_briefing` + `batch_complete` |
| MCP Tools | 13: `searchTasks`, `createTask`, `completeTask`, `updateTask`, `getCalendarEvents`, `getUpcoming`, `syncCalendar`, `assignTask`, `listUsers` + more |
| Communication | REST API to addon at `http://{host}:{port}/api/tasks` |
| Polling | 30s via `DataUpdateCoordinator` |
| Auto-install | Addon copies component to `/homeassistant/custom_components/` at boot |
| Auto-setup | Addon calls `POST /discovery` on Supervisor API (3 retries) → triggers `async_step_hassio()` in config_flow |
| Session | Uses HA shared aiohttp session (`async_get_clientsession`) — no self-managed sessions |
| Config | Auto-discovered on addon start; manual fallback: Settings → Devices & Services → Add Integration → Meitheal |
| HA Checklist | Passes both [component](https://developers.home-assistant.io/docs/creating_component_code_review) and [platform](https://developers.home-assistant.io/docs/creating_platform_code_review) publishing checklists |
| Icon | `icon.png` bundled in component directory |

## Companion App Integration

| Property | Value |
|----------|-------|
| Path | `integrations/home-assistant/companion_actions.yaml`, `blueprints/` |
| Docs | `docs/companion-app-setup.md` |
| Platforms | Android (shortcuts, widgets, quick settings) + iOS (Siri, Apple Watch, CarPlay) |
| Scripts | `meitheal_quick_task`, `meitheal_check_overdue`, `meitheal_sync_now`, `meitheal_daily_summary` |
| iOS Actions | `MEITHEAL_ADD_TASK`, `MEITHEAL_SHOW_OVERDUE`, `MEITHEAL_SYNC`, `MEITHEAL_DAILY_SUMMARY` |
| Haptics | Android vibration pattern: `100, 200, 100, 200` on task notifications |
| Deep-links | Ingress paths for direct task navigation |
| Blueprints | Task notifications with actions, quick-add from reply, complete from notification button |
| Android Shortcuts | Dashboard path: `/api/hassio_ingress/<TOKEN>/[kanban\|today\|calendar]` |

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

## Grocy Integration

| Property | Value |
|----------|-------|
| Domain | `domains/grocy/` bounded context |
| Bridge | `grocy-bridge.ts` — bidirectional sync |
| Adapter | `GrocyAdapter` in `packages/integration-core/` |
| Mapper | `grocy-mapper.ts` — maps Grocy chores/tasks/shopping → Meitheal tasks |
| Auth | `grocy_api_key` stored in settings (encrypted) |
| API Routes | `GET/PUT /api/grocy/settings`, `POST /api/grocy/test`, `POST /api/grocy/sync` |
| Sync modes | `import`, `export`, `bidirectional` |
| Auto-start | `autoStartGrocySync()` in `ha-startup.ts` reads settings on boot |
| Settings UI | Settings → Integrations → Grocy (URL, API key, mode, interval) |

## User Assignment System

| Property | Value |
|----------|-------|
| Users API | `GET /api/users` — merges HA-discovered + custom users |
| Custom Users | `POST/PUT/DELETE /api/users/custom` — CRUD for custom users |
| Default Assignee | `GET/PUT /api/users/default` — auto-assign setting |
| HA Discovery | `listHAUsers()` in `ha-users.ts` via Supervisor API (cached 60s) |
| DB Tables | `custom_users`, `app_settings` |
| Task Schema | `assigned_to TEXT` column with index |
| UI | Assign To dropdown in New Task Modal + Task Detail sidebar |
| MCP | `assignTask`, `listUsers` tools |
| Auto-assign | POST `/api/tasks` reads `default_assignee` from `app_settings` if not specified |
| @mention | `@name` patterns in title auto-resolve against user list |

## Database

| Property | Value |
|----------|-------|
| Engine | SQLite via libSQL |
| ORM | Drizzle ORM 0.45 |
| Connection | `MEITHEAL_DB_URL` (default: `file:/data/meitheal.db`) |
| Tables | `tasks`, `boards`, `lanes`, `saved_filters`, `reminders`, `domain_events`, `integration_attempts`, `calendar_confirmations`, `todo_sync_confirmations`, `custom_users`, `app_settings`, `settings`, `audit_trail` |
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

## Notification Dispatch System

| Property | Value |
|----------|-------|
| Domain | `domains/notifications/` bounded context |
| Dispatch | `tasks/[id].ts` PUT handler — fires on assignment, P1 escalation, completion |
| Scheduler | `due-date-reminders.ts` — 5-min interval, configurable window (5-1440 min) |
| Channels | Sidebar bell (`persistent_notification`), mobile push (`notify.mobile_app_*`), calendar reminder (`calendar.create_event`) |
| Settings | `notification_preferences` key in settings table |
| Per-user | `disabled_users` array in prefs — users can opt out individually |
| Android | Channels (`meitheal_urgent`, `meitheal_tasks`, `meitheal_reminders`), importance levels, accent colors, actionable buttons |
| iOS | `interruption-level: time-sensitive` for P1, badge counts |
| Actionable | "✅ Mark Done" button fires `MEITHEAL_TASK_DONE_{id}` event → `ha-connection.ts` handler |
| Auto-dismiss | On task completion: clears `meitheal_urgent_*`, `meitheal_assigned_*`, `meitheal_due_*` tags |
| Safety | Bounded sentReminders Set (500), processing mutex, cached settings (5-min TTL), try/catch on all WS handlers |

---

*Integration audit: 2026-03-06 — v0.1.69 notification dispatch system added*
