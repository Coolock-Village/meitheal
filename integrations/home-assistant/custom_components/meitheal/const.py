"""Meitheal Home Assistant integration — constants."""

from datetime import timedelta

from homeassistant.const import Platform

DOMAIN = "meitheal"
PLATFORMS = [Platform.TODO, Platform.SENSOR]

# Addon network defaults (internal Docker DNS)
DEFAULT_HOST = "local_meitheal"
LEGACY_HOST = "local_meitheal_hub"
DEFAULT_PORT = 3000

CONF_HOST = "host"
CONF_PORT = "port"

# Polling interval for DataUpdateCoordinator
SCAN_INTERVAL = timedelta(seconds=30)

# Service names
SERVICE_CREATE_TASK = "create_task"
SERVICE_COMPLETE_TASK = "complete_task"
SERVICE_SYNC_TODO = "sync_todo"
SERVICE_SEARCH_TASKS = "search_tasks"
SERVICE_GET_OVERDUE_TASKS = "get_overdue_tasks"

# Meitheal task statuses
STATUS_BACKLOG = "backlog"
STATUS_TODO = "todo"
STATUS_IN_PROGRESS = "in_progress"
STATUS_DONE = "done"
STATUS_CANCELLED = "cancelled"
