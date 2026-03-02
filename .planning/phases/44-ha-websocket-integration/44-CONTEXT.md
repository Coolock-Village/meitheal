---
phase: 44
name: HA WebSocket Integration — Server-Side
goal: Establish persistent server-side WebSocket connection to HA Core via Supervisor for real-time entity access, service calls, and event emission
status: complete
---

# Phase 44 Context — HA WebSocket Integration

## Goal

Build the server-side HA domain module using `home-assistant-js-websocket` to connect to HA Core via `ws://supervisor/core/websocket` with `SUPERVISOR_TOKEN` auth.

## Background

HA Supervisor provides a WebSocket API at `ws://supervisor/core/websocket` for addons. The `home-assistant-js-websocket` library (official HA JS client) supports server-side usage with `createLongLivedTokenAuth`. This is the foundation for all deeper HA integration (calendar sync, entity tracking, event emission, notifications).

## Decisions

- **Server-side only**: WebSocket runs on the Node.js server, NOT in the browser (CSP, auth, reliability)
- **SSE bridge**: Browser receives updates via SSE from server, not direct WS to HA
- **`ha-system` sentinel**: Background process logs use `request_id: "ha-system"` for `LogEvent` compliance
- **Graceful standalone**: All HA features silently no-op when `SUPERVISOR_TOKEN` is absent (standalone mode)
- **DDD bounded context**: All HA code lives in `src/domains/ha/` with barrel export

## Architecture

```
Browser ←→ SSE (/api/sse) ←→ Node Server ←→ WS (supervisor/core/websocket) ←→ HA Core
```

## Persona Audit Alignment

| Persona | Finding | Status |
|---------|---------|--------|
| #49 HA Addon Expert | Worker can't access Supervisor API | ✅ Fixed: server-side WS |
| #50 Domain Architect | Duplicated domain logic | ✅ Proper DDD module |
| #32 Logging Architect | Unstructured logs | ✅ Uses @meitheal/domain-observability |
| #34 Audit Trail Eng | No domain events | ✅ ha-events.ts fires HA bus events |
