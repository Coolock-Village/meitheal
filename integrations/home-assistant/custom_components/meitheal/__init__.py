"""Meitheal Home Assistant custom component scaffold."""

from __future__ import annotations

import os
from typing import Any

import aiohttp
import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

DOMAIN = "meitheal"
SERVICE_CREATE_TASK = "create_task"
MODE_NATIVE = "native"
MODE_VIKUNJA = "vikunja_compat"
DEFAULT_API_BASE_URL = "http://localhost:3000"

CREATE_TASK_SCHEMA = vol.Schema(
    {
        vol.Required("title"): cv.string,
        vol.Optional("description"): cv.string,
        vol.Optional("project_id", default=1): cv.positive_int,
        vol.Optional("mode", default=MODE_NATIVE): vol.In([MODE_NATIVE, MODE_VIKUNJA]),
    }
)


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Set up the Meitheal service scaffold."""
    api_base_url = os.environ.get("MEITHEAL_API_BASE_URL", DEFAULT_API_BASE_URL).rstrip("/")
    compat_token = os.environ.get("MEITHEAL_VIKUNJA_API_TOKEN")

    async def async_create_task(call: ServiceCall) -> None:
        mode = call.data.get("mode", MODE_NATIVE)
        title = call.data["title"]
        description = call.data.get("description")

        if mode == MODE_NATIVE:
            endpoint = f"{api_base_url}/api/tasks/create"
            payload: dict[str, Any] = {"title": title}
            if description:
                payload["frameworkPayload"] = {"description": description}
            headers = {"content-type": "application/json"}
        else:
            project_id = int(call.data.get("project_id", 1))
            endpoint = f"{api_base_url}/api/v1/projects/{project_id}/tasks"
            payload = {"title": title}
            if description:
                payload["description"] = description
            headers = {"content-type": "application/json"}
            if compat_token:
                headers["authorization"] = f"Bearer {compat_token}"

        timeout = aiohttp.ClientTimeout(total=15)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            request_coro = (
                session.put(endpoint, json=payload, headers=headers)
                if mode == MODE_VIKUNJA
                else session.post(endpoint, json=payload, headers=headers)
            )
            async with request_coro as response:
                if response.status >= 300:
                    response_text = await response.text()
                    raise HomeAssistantError(
                        f"Meitheal task create failed ({response.status}): {response_text}"
                    )

    hass.services.async_register(
        DOMAIN, SERVICE_CREATE_TASK, async_create_task, schema=CREATE_TASK_SCHEMA
    )
    return True
