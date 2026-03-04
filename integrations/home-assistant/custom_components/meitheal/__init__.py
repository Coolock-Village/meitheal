"""Meitheal Home Assistant integration — setup and service registration.

Registers Meitheal as a first-class HA integration with:
- todo.meitheal_tasks: TodoListEntity proxy to Meitheal REST API
- sensor.meitheal_active_tasks: Active task count
- sensor.meitheal_overdue_tasks: Overdue task count
- sensor.meitheal_total_tasks: Total task count
- meitheal.create_task: Service to create tasks
- meitheal.complete_task: Service to mark tasks done
- meitheal.sync_todo: Service to trigger manual sync
- meitheal.search_tasks: Service to search tasks by keyword
- meitheal.get_overdue_tasks: Service to retrieve overdue tasks
"""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST, CONF_PORT
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from .const import (
    DEFAULT_HOST,
    DEFAULT_PORT,
    DOMAIN,
    PLATFORMS,
    SERVICE_COMPLETE_TASK,
    SERVICE_CREATE_TASK,
    SERVICE_GET_OVERDUE_TASKS,
    SERVICE_SEARCH_TASKS,
    SERVICE_SYNC_TODO,
)
from .coordinator import MeithealCoordinator

# LLM API is optional — requires HA 2026.3+ with homeassistant.helpers.llm
try:
    from .llm_api import async_register_llm_api
    _HAS_LLM_API = True
except ImportError:
    _HAS_LLM_API = False

_LOGGER = logging.getLogger(__name__)

CREATE_TASK_SCHEMA = vol.Schema(
    {
        vol.Required("title"): cv.string,
        vol.Optional("description"): cv.string,
    }
)

COMPLETE_TASK_SCHEMA = vol.Schema(
    {
        vol.Exclusive("task_id", "task_identifier"): cv.string,
        vol.Exclusive("title", "task_identifier"): cv.string,
    }
)

SEARCH_TASKS_SCHEMA = vol.Schema(
    {
        vol.Required("query"): cv.string,
        vol.Optional("status"): vol.In(["todo", "in_progress", "done"]),
    }
)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Meitheal from a config entry."""
    host = entry.data.get(CONF_HOST, DEFAULT_HOST)
    port = entry.data.get(CONF_PORT, DEFAULT_PORT)

    coordinator = MeithealCoordinator(hass, host, port)
    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = coordinator

    # Forward to platforms (todo, sensor)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # ── Service handlers ─────────────────────────────────────────────────

    async def handle_create_task(call: ServiceCall) -> None:
        """Handle meitheal.create_task service call."""
        try:
            await coordinator.async_create_task(
                title=call.data["title"],
                description=call.data.get("description"),
            )
        except Exception as err:
            raise HomeAssistantError(f"Failed to create task: {err}") from err

    async def handle_complete_task(call: ServiceCall) -> None:
        """Handle meitheal.complete_task service call."""
        try:
            await coordinator.async_complete_task(
                task_id=call.data.get("task_id"),
                title=call.data.get("title"),
            )
        except Exception as err:
            raise HomeAssistantError(f"Failed to complete task: {err}") from err

    async def handle_sync_todo(call: ServiceCall) -> None:
        """Handle meitheal.sync_todo service call."""
        try:
            await coordinator.async_request_refresh()
        except Exception as err:
            raise HomeAssistantError(f"Sync failed: {err}") from err

    async def handle_search_tasks(call: ServiceCall) -> ServiceResponse:
        """Handle meitheal.search_tasks service call."""
        query = call.data["query"].lower()
        status_filter = call.data.get("status")

        if not coordinator.data:
            return {"tasks": []}

        results = []
        for task in coordinator.data.tasks:
            # Filter by status if specified
            if status_filter and task.status != status_filter:
                continue
            # Match query against title and description
            if query in task.title.lower() or (
                task.description and query in task.description.lower()
            ):
                results.append({
                    "id": task.id,
                    "title": task.title,
                    "status": task.status,
                    "priority": task.priority,
                    "due_date": task.due_date,
                    "description": task.description,
                })

        return {"tasks": results}

    async def handle_get_overdue_tasks(call: ServiceCall) -> ServiceResponse:
        """Handle meitheal.get_overdue_tasks service call."""
        if not coordinator.data:
            return {"tasks": []}

        results = [
            {
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date,
                "description": task.description,
            }
            for task in coordinator.data.tasks
            if task.is_overdue
        ]

        return {"tasks": results}

    # ── Register services ────────────────────────────────────────────────

    hass.services.async_register(
        DOMAIN, SERVICE_CREATE_TASK, handle_create_task, schema=CREATE_TASK_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_COMPLETE_TASK, handle_complete_task, schema=COMPLETE_TASK_SCHEMA
    )
    hass.services.async_register(DOMAIN, SERVICE_SYNC_TODO, handle_sync_todo)
    hass.services.async_register(
        DOMAIN,
        SERVICE_SEARCH_TASKS,
        handle_search_tasks,
        schema=SEARCH_TASKS_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_GET_OVERDUE_TASKS,
        handle_get_overdue_tasks,
        supports_response=SupportsResponse.ONLY,
    )

    # Register LLM API — makes Meitheal tasks available to all HA conversation agents
    # Requires HA 2026.3+ with homeassistant.helpers.llm
    if _HAS_LLM_API:
        try:
            unreg_llm = async_register_llm_api(hass, entry.entry_id)
            entry.async_on_unload(unreg_llm)
        except Exception:
            _LOGGER.warning("Could not register Meitheal LLM API — feature disabled")
    else:
        _LOGGER.info("Meitheal LLM API not available (requires HA 2026.3+)")

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a Meitheal config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        coordinator: MeithealCoordinator = hass.data[DOMAIN].pop(entry.entry_id)
        await coordinator.async_shutdown()
        # Remove services if no more entries
        if not hass.data[DOMAIN]:
            hass.services.async_remove(DOMAIN, SERVICE_CREATE_TASK)
            hass.services.async_remove(DOMAIN, SERVICE_COMPLETE_TASK)
            hass.services.async_remove(DOMAIN, SERVICE_SYNC_TODO)
            hass.services.async_remove(DOMAIN, SERVICE_SEARCH_TASKS)
            hass.services.async_remove(DOMAIN, SERVICE_GET_OVERDUE_TASKS)
    return unload_ok
