"""Meitheal Home Assistant integration — DataUpdateCoordinator."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import aiohttp
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import DOMAIN, SCAN_INTERVAL

_LOGGER = logging.getLogger(__name__)


class MeithealTask:
    """Representation of a Meitheal task."""

    def __init__(self, data: dict[str, Any]) -> None:
        self.id: str = str(data.get("id", ""))
        self.title: str = data.get("title", "")
        self.status: str = data.get("status", "todo")
        self.description: str | None = data.get("description")
        self.priority: int = data.get("priority", 3)
        self.due_date: str | None = data.get("due_date") or data.get("dueDate")
        self.labels: list[str] = data.get("labels", [])
        self.position: int = data.get("position", 0)
        self.created_at: str | None = data.get("created_at") or data.get("createdAt")
        self.updated_at: str | None = data.get("updated_at") or data.get("updatedAt")

    @property
    def is_overdue(self) -> bool:
        """Check if task is overdue."""
        if not self.due_date or self.status == "done":
            return False
        try:
            due = datetime.fromisoformat(self.due_date.replace("Z", "+00:00"))
            return due < datetime.now(due.tzinfo)
        except (ValueError, TypeError):
            return False


class MeithealCoordinatorData:
    """Structured data from coordinator update."""

    def __init__(self, tasks: list[MeithealTask]) -> None:
        self.tasks = tasks
        self.active_count = sum(1 for t in tasks if t.status != "done")
        self.overdue_count = sum(1 for t in tasks if t.is_overdue)
        self.total_count = len(tasks)


class MeithealCoordinator(DataUpdateCoordinator[MeithealCoordinatorData]):
    """Coordinator to poll Meitheal addon REST API for tasks."""

    def __init__(self, hass: HomeAssistant, host: str, port: int) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=SCAN_INTERVAL,
        )
        self._base_url = f"http://{host}:{port}"
        self._session: aiohttp.ClientSession | None = None

    async def _ensure_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=15)
            self._session = aiohttp.ClientSession(timeout=timeout)
        return self._session

    async def _async_update_data(self) -> MeithealCoordinatorData:
        """Fetch tasks from Meitheal REST API."""
        try:
            session = await self._ensure_session()
            async with session.get(
                f"{self._base_url}/api/tasks",
                headers={"content-type": "application/json"},
            ) as response:
                if response.status >= 400:
                    raise UpdateFailed(
                        f"Meitheal API returned {response.status}"
                    )
                data = await response.json()

                # API may return { tasks: [...] } or [...] directly
                raw_tasks = data if isinstance(data, list) else data.get("tasks", [])
                tasks = [MeithealTask(t) for t in raw_tasks]
                return MeithealCoordinatorData(tasks)

        except aiohttp.ClientError as err:
            raise UpdateFailed(f"Cannot reach Meitheal: {err}") from err

    async def async_create_task(
        self, title: str, description: str | None = None
    ) -> None:
        """Create a task via Meitheal REST API."""
        session = await self._ensure_session()
        payload: dict[str, Any] = {"title": title}
        if description:
            payload["frameworkPayload"] = {"description": description}
        async with session.post(
            f"{self._base_url}/api/tasks/create",
            json=payload,
            headers={"content-type": "application/json"},
        ) as response:
            if response.status >= 300:
                text = await response.text()
                raise UpdateFailed(f"Create task failed ({response.status}): {text}")
        await self.async_request_refresh()

    async def async_complete_task(
        self, task_id: str | None = None, title: str | None = None
    ) -> None:
        """Mark a task as done."""
        # Find task by ID or title
        if not task_id and title and self.data:
            for task in self.data.tasks:
                if task.title.lower() == title.lower():
                    task_id = task.id
                    break
        if not task_id:
            raise UpdateFailed("Task not found")

        session = await self._ensure_session()
        async with session.put(
            f"{self._base_url}/api/tasks/{task_id}",
            json={"status": "done"},
            headers={"content-type": "application/json"},
        ) as response:
            if response.status >= 300:
                text = await response.text()
                raise UpdateFailed(f"Complete task failed ({response.status}): {text}")
        await self.async_request_refresh()

    async def async_delete_task(self, task_id: str) -> None:
        """Delete a task."""
        session = await self._ensure_session()
        async with session.delete(
            f"{self._base_url}/api/tasks/{task_id}",
            headers={"content-type": "application/json"},
        ) as response:
            if response.status >= 300:
                text = await response.text()
                raise UpdateFailed(f"Delete task failed ({response.status}): {text}")
        await self.async_request_refresh()

    async def async_update_task(self, task_id: str, updates: dict[str, Any]) -> None:
        """Update task fields."""
        session = await self._ensure_session()
        async with session.put(
            f"{self._base_url}/api/tasks/{task_id}",
            json=updates,
            headers={"content-type": "application/json"},
        ) as response:
            if response.status >= 300:
                text = await response.text()
                raise UpdateFailed(f"Update task failed ({response.status}): {text}")
        await self.async_request_refresh()

    async def async_check_health(self) -> bool:
        """Check if Meitheal addon is reachable."""
        try:
            session = await self._ensure_session()
            async with session.get(f"{self._base_url}/api/health") as response:
                return response.status == 200
        except aiohttp.ClientError:
            return False

    async def async_shutdown(self) -> None:
        """Close the aiohttp session."""
        if self._session and not self._session.closed:
            await self._session.close()
