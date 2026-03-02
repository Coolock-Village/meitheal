/**
 * HA Domain — Barrel Export
 * @domain ha
 * @bounded-context integration
 */
export { getHAConnection, getHAConnectionStatus, getHAConfig, closeHAConnection } from "./ha-connection";
export { initEntitySubscription, getAllEntities, getEntity, getEntitiesByDomain, getCalendarEntities, getTodoEntities, onEntityChange, stopEntitySubscription } from "./ha-entities";
export { listCalendarEvents, createCalendarEvent, addTodoItem, sendNotification, callHAService } from "./ha-services";
export type { CalendarEvent, TodoItem } from "./ha-services";
export { fireHAEvent, emitTaskCreated, emitTaskUpdated, emitTaskCompleted, emitTaskDeleted, emitTaskOverdue, emitBoardUpdated } from "./ha-events";
export type { MeithealEventType, MeithealTaskEventData, MeithealBoardEventData } from "./ha-events";
