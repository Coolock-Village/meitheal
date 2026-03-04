"""Meitheal Home Assistant integration — config flow."""

from __future__ import annotations

import logging
from typing import Any

import aiohttp
import voluptuous as vol
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.const import CONF_HOST, CONF_PORT

from .const import DEFAULT_HOST, DEFAULT_PORT, DOMAIN, LEGACY_HOST

_LOGGER = logging.getLogger(__name__)


class MeithealConfigFlow(ConfigFlow, domain=DOMAIN):
    """Config flow for Meitheal integration."""

    VERSION = 1

    def __init__(self) -> None:
        """Initialise flow state."""
        self._discovered_host: str = DEFAULT_HOST
        self._discovered_port: int = DEFAULT_PORT

    # ── Supervisor addon discovery (zero-touch) ──────────────────────────

    async def async_step_hassio(
        self, discovery_info: dict[str, Any]
    ) -> ConfigFlowResult:
        """Handle Supervisor addon discovery.

        Triggered automatically when the addon calls POST /discovery
        on the Supervisor API at boot. The user sees a simple
        "Meitheal Discovered — click Submit" confirmation instead of
        the raw host/port form.
        """
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        host = discovery_info.get(CONF_HOST, DEFAULT_HOST)
        port = int(discovery_info.get(CONF_PORT, DEFAULT_PORT))

        self._discovered_host = host
        self._discovered_port = port

        # Validate the connection before showing confirmation
        if not await self._test_connection(host, port):
            return self.async_abort(reason="cannot_connect")

        return await self.async_step_hassio_confirm()

    async def async_step_hassio_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Confirm Supervisor addon discovery."""
        if user_input is not None:
            return self.async_create_entry(
                title="Meitheal",
                data={
                    CONF_HOST: self._discovered_host,
                    CONF_PORT: self._discovered_port,
                },
            )

        return self.async_show_form(
            step_id="hassio_confirm",
            description_placeholders={
                "addon": "Meitheal",
            },
        )

    # ── Manual user setup (fallback) ─────────────────────────────────────

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle manual user setup step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            host = user_input[CONF_HOST]
            port = user_input[CONF_PORT]

            # Validate connection
            if await self._test_connection(host, port):
                await self.async_set_unique_id(DOMAIN)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title="Meitheal",
                    data={CONF_HOST: host, CONF_PORT: port},
                )
            errors["base"] = "cannot_connect"

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_HOST, default=DEFAULT_HOST): str,
                    vol.Required(CONF_PORT, default=DEFAULT_PORT): int,
                }
            ),
            errors=errors,
        )

    # ── Connection test ──────────────────────────────────────────────────

    @staticmethod
    async def _test_connection(host: str, port: int) -> bool:
        """Test connection to Meitheal addon."""
        try:
            timeout = aiohttp.ClientTimeout(total=10)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                candidates = [host]
                # Backward compatibility: old addon hostname used "_hub" suffix.
                if host == DEFAULT_HOST:
                    candidates.append(LEGACY_HOST)

                for candidate_host in candidates:
                    url = f"http://{candidate_host}:{port}/api/health"
                    try:
                        async with session.get(url) as response:
                            if response.status == 200:
                                return True
                    except (aiohttp.ClientError, TimeoutError):
                        _LOGGER.debug(
                            "Cannot connect to Meitheal at %s:%s",
                            candidate_host,
                            port,
                        )
                        continue
                return False
        except (aiohttp.ClientError, TimeoutError):
            _LOGGER.debug("Cannot connect to Meitheal at %s:%s", host, port)
            return False
