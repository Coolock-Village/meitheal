"""Meitheal Home Assistant integration — sensor entities."""

from __future__ import annotations

import logging

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import MeithealCoordinator

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Meitheal sensor entities from config entry."""
    coordinator: MeithealCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        [
            MeithealActiveTasksSensor(coordinator, entry),
            MeithealOverdueTasksSensor(coordinator, entry),
            MeithealTotalTasksSensor(coordinator, entry),
        ],
        True,
    )


class MeithealActiveTasksSensor(
    CoordinatorEntity[MeithealCoordinator], SensorEntity
):
    """Sensor: count of active (non-done) tasks."""

    _attr_has_entity_name = True
    _attr_translation_key = "active_tasks"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = "tasks"
    _attr_icon = "mdi:checkbox-marked-circle-outline"

    def __init__(self, coordinator: MeithealCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_active_tasks"
        self._attr_name = "Active Tasks"

    @property
    def native_value(self) -> int | None:
        """Return active task count."""
        if not self.coordinator.data:
            return None
        return self.coordinator.data.active_count


class MeithealOverdueTasksSensor(
    CoordinatorEntity[MeithealCoordinator], SensorEntity
):
    """Sensor: count of overdue tasks."""

    _attr_has_entity_name = True
    _attr_translation_key = "overdue_tasks"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = "tasks"
    _attr_icon = "mdi:clock-alert-outline"

    def __init__(self, coordinator: MeithealCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_overdue_tasks"
        self._attr_name = "Overdue Tasks"

    @property
    def native_value(self) -> int | None:
        """Return overdue task count."""
        if not self.coordinator.data:
            return None
        return self.coordinator.data.overdue_count


class MeithealTotalTasksSensor(
    CoordinatorEntity[MeithealCoordinator], SensorEntity
):
    """Sensor: total task count."""

    _attr_has_entity_name = True
    _attr_translation_key = "total_tasks"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = "tasks"
    _attr_icon = "mdi:format-list-checks"

    def __init__(self, coordinator: MeithealCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_total_tasks"
        self._attr_name = "Total Tasks"

    @property
    def native_value(self) -> int | None:
        """Return total task count."""
        if not self.coordinator.data:
            return None
        return self.coordinator.data.total_count
