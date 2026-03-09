# Integrations

> Last mapped: 2026-03-09 — v0.1.99

## Home Assistant (Primary)

### Connection
- **WebSocket**: `home-assistant-js-websocket` → `domains/ha/ha-connection.ts`
- **REST API**: `lib/supervisor-fetch.ts` → Supervisor endpoints
- **Auth**: Trusts `X-Hassio-User-ID` and `X-Ingress-Path` from Supervisor
- **Startup**: `domains/ha/ha-startup.ts` — auto-detect HA via `SUPERVISOR_TOKEN`

### HA Domain Files

| Integration | Domain | Key Files |
|-------------|--------|-----------|
| WebSocket | `domains/ha/` | `ha-connection.ts`, `ha-events.ts` |
| Entities | `domains/ha/` | `ha-entities.ts` |
| Services | `domains/ha/` | `ha-services.ts` |
| Users | `domains/ha/` | `ha-users.ts` |
| Calendar sync | `domains/calendar/` | `calendar-bridge.ts`, `caldav-client.ts` |
| Todo lists | `domains/todo/` | `todo-bridge.ts`, `todo-status-mapper.ts` |
| Notifications | API | `pages/api/tasks/[id].ts` (persistent + mobile) |
| AI Assist | `domains/ai/` | `ha-assist-service.ts` |

### HA API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/ha/status` | Connection status |
| `GET /api/ha/connection` | Establish WebSocket |
| `GET /api/ha/calendars` | List calendar entities |
| `GET /api/ha/agents` | List conversation agents |
| `POST /api/ha/assist` | Send to HA Assist |
| `GET /api/ha/services` | Available services |
| `GET /api/ha/addons` | Installed addons |
| `GET /api/todo` | List todo entities |
| `POST /api/todo/items` | CRUD todo items |
| `POST /api/todo/sync` | Sync todo lists |

## Vikunja v1 Compatibility

Drop-in API at `/api/v1/*` for Vikunja-compatible clients:

| Route | Maps To |
|-------|---------|
| `GET /api/v1/tasks` | List tasks |
| `GET /api/v1/projects` | List boards |
| `POST /api/v1/projects/[id]/tasks` | Create task |
| `GET /api/v1/labels` | List labels |
| `GET /api/v1/users` | Current user |
| `GET /api/v1/tasks/[id]/labels` | Task labels |
| `GET /api/v1/tasks/[id]/assignees` | Task assignees |

## Grocy

- **Bridge**: `domains/grocy/grocy-bridge.ts`
- **Mapper**: `domains/grocy/grocy-mapper.ts`
- **Client**: `lib/grocy-client.ts`
- **Routes**: `/api/grocy/{settings,sync,test,auto-key}`

## Webhooks

- **Dispatcher**: `lib/webhook-dispatcher.ts`
- **Config**: `packages/integration-core/src/webhook-config.ts`
- **Emitter**: `packages/integration-core/src/webhook-emitter.ts`
- **Outbound**: `lib/sync-outbound.ts`
- Supports: n8n, generic HTTP, HMAC signing

## Agent Protocols

### A2A (Agent-to-Agent)
- `packages/integration-core/src/a2a-handler.ts`
- Routes: `/api/a2a/{agent-card,message,tasks/[id]}`

### MCP
- Discovery: `public/.well-known/mcp.json`
- Route: `pages/api/mcp.ts`

## Node-RED
- Route: `/api/integrations/nodered/flows`
- Dev: `.devcontainer/nodered/`

## Export / Import

| Route | Format |
|-------|--------|
| `GET /api/export/tasks.csv` | CSV |
| `GET /api/export/tasks.json` | JSON |
| `GET /api/export/database.sqlite` | Full SQLite |
| `GET /api/export/settings.json` | Settings |
| `POST /api/import/settings` | Settings restore |

## Backup (HA Supervisor)
- Prepare: `pages/api/backup/prepare.ts`
- Complete: `pages/api/backup/complete.ts`
- Hot backup via `meitheal-hub/rootfs/` hooks

## Calendar (CalDAV)
- Client: `domains/calendar/caldav-client.ts`
- Bridge: `domains/calendar/calendar-bridge.ts`
- Routes: `/api/integrations/calendar/{caldav-credentials,sync,confirmation}`

## Real-Time
- **SSE**: `pages/api/sse.ts` — Server-sent events for UI updates
- **PWA**: `public/sw.js` — Service worker (cache-first static, network-first API)
