# Phase 55: HA Entity & Action Strategy - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

## Phase Boundary

Phase 55 delivers Meitheal as a **first-class HA integration** — registering its own entities, exposing services/actions for automations, and appearing in HA's entity registry. This makes Meitheal visible to HA dashboards, automations, scripts, and voice assistants.

## Implementation Decisions

### Entity Registration: Option C (Python Custom Component) — Winner

**Decision: Option C (Python custom component) is the only correct answer.**

Rationale:

| Factor | Option B (MQTT Discovery) | Option C (Python Custom Component) |
|--------|--------------------------|-------------------------------------|
| **Can register `todo.*` entity** | ❌ MQTT discovery only supports sensor, binary_sensor, switch, light, cover, fan, climate, lock, alarm — **NOT todo** | ✅ Full platform support including `todo` |
| **Custom HA services/actions** | ❌ Cannot register services via MQTT | ✅ `async_setup_platform` + `hass.services.async_register()` |
| **HA config flow UI** | ❌ Not possible | ✅ Full config flow with settings toggle |
| **Entity attributes** | Limited to MQTT payload | ✅ Arbitrary attributes, device_info, unique_id |
| **Sensor entities** (`sensor.meitheal_*`) | ✅ Works | ✅ Works |
| **Requires MQTT broker** | ✅ Yes (Mosquitto) | ❌ No — talks directly to addon |
| **Install barrier** | Medium (needs MQTT) | **None if bundled in addon** |
| **R-011 alignment** | ❌ Doesn't satisfy | ✅ Directly satisfies R-011 |

**MQTT Discovery was eliminated** because it literally cannot create `todo` entities — the HA MQTT integration only supports a fixed set of entity platforms, and `todo` is not one of them.

### Language: Python (not Go)

**Decision: Python is required. Go cannot register HA entities.**

HA Core only loads Python modules from `custom_components/<domain>/`. Go can only interact with HA externally via REST/WebSocket — it cannot register entities, services, or config flows. A Go sidecar would add complexity without any benefit over what the Astro addon already does.

If performance is a concern: the Python component is lightweight — it's a thin proxy that calls the Meitheal addon REST API. No heavy processing.

### Install Barrier: Eliminated via Auto-Install

**Decision: The addon will auto-install the custom component — no separate step needed.**

Strategy:
1. Addon bundles `custom_components/meitheal/` in its Docker image
2. On startup, addon checks if `/homeassistant/custom_components/meitheal/` exists
3. If not: copies files, calls `homeassistant.reload_custom_components` via WS
4. Settings toggle: "Register Meitheal entities with HA" (on/off) — controls whether the component is active
5. Uninstall: addon removes the component dir on settings disable

This mirrors how addons like Z-Wave JS and Node-RED handle their companion integrations.

### Entity Strategy

| Entity | Type | Purpose |
|--------|------|---------|
| `todo.meitheal_tasks` | TodoListEntity | Meitheal tasks visible in HA todo dashboard |
| `sensor.meitheal_active_tasks` | SensorEntity | Count of active tasks (for dashboards, automations) |
| `sensor.meitheal_overdue_tasks` | SensorEntity | Count of overdue tasks |
| `sensor.meitheal_total_tasks` | SensorEntity | Total task count |
| `binary_sensor.meitheal_sync_active` | BinarySensorEntity | Whether todo sync is running |

### Action Strategy

| Service | Purpose |
|---------|---------|
| `meitheal.add_task` | Create a task (title, priority, due_date, board_id) |
| `meitheal.complete_task` | Mark a task as done (by ID or title) |
| `meitheal.get_tasks` | Retrieve task list (for scripts/automations) |
| `meitheal.sync_todo` | Trigger manual sync |

### Claude's Discretion

- Component file structure and module layout
- Error handling patterns (structured logging already exists)
- Config flow UI design (simple: addon URL auto-detected)
- Entity update frequency (recommended: 30s polling or push via SSE)

## Specific Ideas

- HA voice assistant: "Hey Google, add 'buy milk' to my Meitheal list" — works via `meitheal.add_task` service
- HA automation: "When overdue tasks > 3, send notification" — uses `sensor.meitheal_overdue_tasks`
- HA dashboard: Todo card shows Meitheal tasks natively — uses `todo.meitheal_tasks`
- `run.sh` handles component installation silently at addon boot

## Deferred Ideas

- Multi-board entity support (`todo.meitheal_work`, `todo.meitheal_personal`) — future phase
- HA calendar entity for Meitheal tasks (already handled by calendar-bridge) — no duplication needed
- Go sidecar for WebSocket performance — premature optimization, Python proxy is sufficient

---

*Phase: 55-ha-entity-action-strategy*
*Context gathered: 2026-03-02*
