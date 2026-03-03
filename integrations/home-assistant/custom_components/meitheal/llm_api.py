"""Meitheal LLM API — Exposes task management tools to HA conversation agents.

Registers Meitheal as an LLM API provider, making task management tools
available to any HA conversation agent (Google Generative AI, OpenAI, Ollama).

Phase 58: HA LLM API Integration.

Tools:
- SearchTasks: Search tasks by keyword, status, or priority
- GetTaskDetails: Get full task details by ID
- CreateTask: Create a new task
- CompleteTask: Mark a task as done
- GetOverdueTasks: List overdue tasks
- GetTaskSummary: Get summary counts (active, overdue, total)

@see https://developers.home-assistant.io/docs/core/llm/
"""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import llm
from homeassistant.helpers.llm import (
    API,
    APIInstance,
    LLMContext,
    Tool,
    ToolInput,
)
from homeassistant.util.json import JsonObjectType

from .const import DOMAIN
from .coordinator import MeithealCoordinator

_LOGGER = logging.getLogger(__name__)


def _get_coordinator(hass: HomeAssistant) -> MeithealCoordinator | None:
    """Get the first active Meitheal coordinator."""
    data = hass.data.get(DOMAIN, {})
    for _entry_id, coordinator in data.items():
        if isinstance(coordinator, MeithealCoordinator):
            return coordinator
    return None


# ── LLM Tools ──


class SearchTasksTool(Tool):
    """Search Meitheal tasks by keyword, status, or priority."""

    name = "meitheal_search_tasks"
    description = (
        "Search tasks in the Meitheal task manager. "
        "Returns matching tasks filtered by keyword, status, or priority."
    )
    parameters = vol.Schema(
        {
            vol.Optional("query", description="Keyword to search in title and description"): str,
            vol.Optional(
                "status",
                description="Filter by status: todo, in_progress, or done",
            ): vol.In(["todo", "in_progress", "done"]),
            vol.Optional(
                "priority",
                description="Filter by priority (1 = highest, 5 = lowest)",
            ): vol.All(int, vol.Range(min=1, max=5)),
        }
    )

    async def async_call(
        self,
        hass: HomeAssistant,
        tool_input: ToolInput,
        llm_context: LLMContext,
    ) -> JsonObjectType:
        """Execute task search."""
        coordinator = _get_coordinator(hass)
        if not coordinator or not coordinator.data:
            return {"tasks": [], "count": 0, "message": "No tasks available"}

        tasks = coordinator.data.tasks
        query = tool_input.tool_args.get("query", "").lower()
        status = tool_input.tool_args.get("status")
        priority = tool_input.tool_args.get("priority")

        results = []
        for task in tasks:
            if query and query not in task.title.lower() and query not in (task.description or "").lower():
                continue
            if status and task.status != status:
                continue
            if priority and task.priority != priority:
                continue
            results.append(
                {
                    "id": task.id,
                    "title": task.title,
                    "status": task.status,
                    "priority": task.priority,
                    "due_date": task.due_date,
                    "is_overdue": task.is_overdue,
                }
            )

        return {"tasks": results, "count": len(results)}


class GetTaskDetailsTool(Tool):
    """Get full details for a specific Meitheal task."""

    name = "meitheal_get_task"
    description = (
        "Get detailed information about a specific task including "
        "its title, status, description, priority, due date, and labels."
    )
    parameters = vol.Schema(
        {
            vol.Required("task_id", description="The task ID to look up"): str,
        }
    )

    async def async_call(
        self,
        hass: HomeAssistant,
        tool_input: ToolInput,
        llm_context: LLMContext,
    ) -> JsonObjectType:
        """Fetch task details."""
        coordinator = _get_coordinator(hass)
        if not coordinator or not coordinator.data:
            raise HomeAssistantError("Meitheal is not available")

        task_id = tool_input.tool_args["task_id"]
        for task in coordinator.data.tasks:
            if task.id == task_id:
                return {
                    "id": task.id,
                    "title": task.title,
                    "status": task.status,
                    "description": task.description or "",
                    "priority": task.priority,
                    "due_date": task.due_date,
                    "labels": task.labels,
                    "is_overdue": task.is_overdue,
                    "created_at": task.created_at,
                    "updated_at": task.updated_at,
                }

        raise HomeAssistantError(f"Task {task_id} not found")


class CreateTaskTool(Tool):
    """Create a new task in Meitheal."""

    name = "meitheal_create_task"
    description = (
        "Create a new task in the Meitheal task manager. "
        "Provide at minimum a title. Optionally include a description."
    )
    parameters = vol.Schema(
        {
            vol.Required("title", description="Task title"): str,
            vol.Optional("description", description="Task description"): str,
        }
    )

    async def async_call(
        self,
        hass: HomeAssistant,
        tool_input: ToolInput,
        llm_context: LLMContext,
    ) -> JsonObjectType:
        """Create a task."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            raise HomeAssistantError("Meitheal is not available")

        try:
            await coordinator.async_create_task(
                title=tool_input.tool_args["title"],
                description=tool_input.tool_args.get("description"),
            )
        except Exception as err:
            raise HomeAssistantError(f"Failed to create task: {err}") from err

        return {
            "success": True,
            "message": f"Task '{tool_input.tool_args['title']}' created",
        }


class CompleteTaskTool(Tool):
    """Mark a Meitheal task as done."""

    name = "meitheal_complete_task"
    description = (
        "Mark a task as done/completed in Meitheal. "
        "You can specify the task by ID or by title."
    )
    parameters = vol.Schema(
        {
            vol.Optional("task_id", description="Task ID to complete"): str,
            vol.Optional("title", description="Task title to find and complete"): str,
        }
    )

    async def async_call(
        self,
        hass: HomeAssistant,
        tool_input: ToolInput,
        llm_context: LLMContext,
    ) -> JsonObjectType:
        """Complete a task."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            raise HomeAssistantError("Meitheal is not available")

        task_id = tool_input.tool_args.get("task_id")
        title = tool_input.tool_args.get("title")

        if not task_id and not title:
            raise HomeAssistantError("Provide either task_id or title")

        try:
            await coordinator.async_complete_task(task_id=task_id, title=title)
        except Exception as err:
            raise HomeAssistantError(f"Failed to complete task: {err}") from err

        return {"success": True, "message": "Task marked as done"}


class GetOverdueTasksTool(Tool):
    """List overdue tasks from Meitheal."""

    name = "meitheal_get_overdue"
    description = (
        "Get a list of all overdue tasks — tasks with a due date "
        "in the past that haven't been completed yet."
    )
    parameters = vol.Schema({})

    async def async_call(
        self,
        hass: HomeAssistant,
        tool_input: ToolInput,
        llm_context: LLMContext,
    ) -> JsonObjectType:
        """Fetch overdue tasks."""
        coordinator = _get_coordinator(hass)
        if not coordinator or not coordinator.data:
            return {"tasks": [], "count": 0}

        overdue = [
            {
                "id": t.id,
                "title": t.title,
                "due_date": t.due_date,
                "priority": t.priority,
            }
            for t in coordinator.data.tasks
            if t.is_overdue
        ]
        return {"tasks": overdue, "count": len(overdue)}


class GetTaskSummaryTool(Tool):
    """Get a summary of Meitheal task counts."""

    name = "meitheal_task_summary"
    description = (
        "Get a summary of task counts: total tasks, active (not done), "
        "overdue, and completed."
    )
    parameters = vol.Schema({})

    async def async_call(
        self,
        hass: HomeAssistant,
        tool_input: ToolInput,
        llm_context: LLMContext,
    ) -> JsonObjectType:
        """Return task summary."""
        coordinator = _get_coordinator(hass)
        if not coordinator or not coordinator.data:
            return {
                "total": 0,
                "active": 0,
                "overdue": 0,
                "done": 0,
            }

        data = coordinator.data
        done = sum(1 for t in data.tasks if t.status == "done")
        return {
            "total": data.total_count,
            "active": data.active_count,
            "overdue": data.overdue_count,
            "done": done,
        }


# ── LLM API Registration ──

API_PROMPT = (
    "Use the Meitheal task management tools to help the user manage their tasks. "
    "You can search tasks, create new ones, mark them as done, check for overdue items, "
    "and get a summary of their task status. Meitheal is a cooperative task and life engine "
    "for the home."
)


class MeithealLLMAPI(API):
    """Meitheal LLM API — Exposes task tools to HA conversation agents."""

    async def async_get_api_instance(
        self, llm_context: LLMContext
    ) -> APIInstance:
        """Return API instance with all Meitheal tools."""
        return APIInstance(
            api=self,
            api_prompt=API_PROMPT,
            llm_context=llm_context,
            tools=[
                SearchTasksTool(),
                GetTaskDetailsTool(),
                CreateTaskTool(),
                CompleteTaskTool(),
                GetOverdueTasksTool(),
                GetTaskSummaryTool(),
            ],
        )


def async_register_llm_api(hass: HomeAssistant, entry_id: str) -> callable:
    """Register Meitheal LLM API with HA Core.

    Returns an unregister callable for cleanup on unload.
    """
    api = MeithealLLMAPI(
        hass=hass,
        api_id=f"meitheal_tasks-{entry_id}",
        name="Meitheal Tasks",
    )
    unreg = llm.async_register_api(hass, api)
    _LOGGER.info("Registered Meitheal LLM API (entry: %s)", entry_id)
    return unreg
