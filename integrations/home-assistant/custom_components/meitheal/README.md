# Meitheal Home Assistant Custom Component

Python custom component that registers Meitheal as a first-class HA integration.

## What It Does

| Entity / Service                | Type           | Purpose                            |
| ------------------------------- | -------------- | ---------------------------------- |
| `todo.meitheal_tasks`           | TodoListEntity | Meitheal tasks in HA todo dashboard |
| `sensor.meitheal_active_tasks`  | Sensor         | Active task count                  |
| `sensor.meitheal_overdue_tasks` | Sensor         | Overdue task count                 |
| `sensor.meitheal_total_tasks`   | Sensor         | Total task count                   |
| `meitheal.create_task`          | Service        | Create a task                      |
| `meitheal.complete_task`        | Service        | Mark a task done                   |
| `meitheal.sync_todo`            | Service        | Manual data refresh                |
| `meitheal.search_tasks`         | Service        | Search tasks by keyword/status     |
| `meitheal.get_overdue_tasks`    | Service        | List all overdue tasks             |

All entities are grouped under a single **Meitheal** device (manufacturer: Coolock Village, model: Task Engine).

### LLM API Tools (Conversation Agents)

When HA 2026.3+ is available, Meitheal registers an LLM API that exposes these tools to all conversation agents (Google AI, OpenAI, Ollama):

| Tool | Description |
| ---- | ----------- |
| `meitheal_search_tasks` | Search by keyword, status, or priority |
| `meitheal_get_task` | Get full task details by ID |
| `meitheal_create_task` | Create a new task |
| `meitheal_complete_task` | Mark a task as done |
| `meitheal_get_overdue` | List overdue tasks |
| `meitheal_task_summary` | Get counts (active, overdue, total, done) |

## Installation

**Automatic**: The Meitheal addon auto-installs this component on startup.
No manual steps needed — the component is bundled in the Docker image and
copied to `/homeassistant/custom_components/meitheal/` at boot.

**Manual**: Copy this directory to `<ha_config>/custom_components/meitheal/`.

## Setup

### Automatic (recommended)

When the Meitheal addon starts, it registers itself via the HA Supervisor
Discovery API. You'll see a notification in HA:

1. Go to **Settings → Devices & Services**
2. Look for the **"Meitheal Discovered"** notification
3. Click **Configure** → **Submit**

That's it — entities and services are created automatically.

### Manual fallback

If discovery doesn't trigger (e.g. running outside HA OS):

1. Go to **Settings → Devices & Services → Add Integration**
2. Search for **"Meitheal"**
3. Enter the hostname (`local_meitheal`) and port (`3000`)
4. Click **Submit**

Legacy installs using `local_meitheal_hub` are auto-detected during setup.

## Architecture

```text
HA Core ←→ custom_components/meitheal ←→ Meitheal addon REST API ←→ SQLite
```

The component is a thin REST proxy. All task storage stays in Meitheal's SQLite.
Data refreshes every 30 seconds via `DataUpdateCoordinator`.

## How Discovery Works

```text
Addon boots → healthcheck passes → POST /discovery to Supervisor
                                          ↓
                            Supervisor triggers config_flow
                                          ↓
                            async_step_hassio() validates connection
                                          ↓
                            User sees "Meitheal Discovered — Submit"
```

The discovery call is idempotent — the Supervisor deduplicates on each boot.

## Voice Assistant Example

"Hey Google, add 'buy milk' to my Meitheal list"
→ Calls `meitheal.create_task` → Task appears in Meitheal

## Automation Example

```yaml
automation:
  - trigger:
      platform: numeric_state
      entity_id: sensor.meitheal_overdue_tasks
      above: 3
    action:
      - service: notify.mobile_app
        data:
          message: "You have {{ states('sensor.meitheal_overdue_tasks') }} overdue tasks!"
```
