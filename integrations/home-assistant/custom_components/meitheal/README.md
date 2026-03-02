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

## Installation

**Automatic**: The Meitheal addon auto-installs this component on startup.
No manual steps needed — the component is bundled in the Docker image and
copied to `/homeassistant/custom_components/meitheal/` at boot.

**Manual**: Copy this directory to `<ha_config>/custom_components/meitheal/`.

## Configuration

After installation, add the integration via HA UI:
Settings → Devices & Services → Add Integration → "Meitheal"

The addon hostname (`local_meitheal_hub`) and port (`3000`) are pre-filled.

## Architecture

```text
HA Core ←→ custom_components/meitheal ←→ Meitheal addon REST API ←→ SQLite
```

The component is a thin REST proxy. All task storage stays in Meitheal's SQLite.
Data refreshes every 30 seconds via `DataUpdateCoordinator`.

## Environment Variables

- `MEITHEAL_API_BASE_URL` — Override addon URL (default: auto-detected from config entry)

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
