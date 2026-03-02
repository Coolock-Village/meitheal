/**
 * HA Service Caller — Server-Side
 *
 * Typed wrapper around HA service actions via server-side WebSocket.
 *
 * @domain ha
 * @bounded-context integration
 */
import { callService } from "home-assistant-js-websocket";
import { getHAConnection } from "./ha-connection";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web", env: process.env.NODE_ENV ?? "development",
  minLevel: "info", enabledCategories: ["ha"],
  redactPatterns: defaultRedactionPatterns, auditEnabled: false,
});
const SYS_REQ = "ha-system";

// ── Calendar Services ──

export interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  uid?: string;
}

export async function listCalendarEvents(
  entityId: string, startDate: string, endDate: string,
): Promise<CalendarEvent[]> {
  const conn = await getHAConnection();
  if (!conn) return [];
  try {
    const result = await conn.sendMessagePromise<Record<string, unknown>>({
      type: "call_service", domain: "calendar", service: "get_events",
      target: { entity_id: entityId },
      service_data: { start_date_time: startDate, end_date_time: endDate },
      return_response: true,
    });
    const response = result as Record<string, { events?: CalendarEvent[] }>;
    const events = response?.[entityId]?.events ?? [];
    logger.log("debug", {
      event: "ha.calendar.list_events", domain: "ha", component: "ha-services",
      request_id: SYS_REQ, message: `Fetched ${events.length} events from ${entityId}`,
    });
    return events;
  } catch (err) {
    logger.log("error", {
      event: "ha.calendar.list_events.failed", domain: "ha", component: "ha-services",
      request_id: SYS_REQ, message: `Failed to list calendar events: ${err}`,
    });
    return [];
  }
}

export async function createCalendarEvent(
  entityId: string, event: Omit<CalendarEvent, "uid">,
): Promise<boolean> {
  const conn = await getHAConnection();
  if (!conn) return false;
  try {
    await callService(conn, "calendar", "create_event", {
      summary: event.summary, start_date_time: event.start,
      end_date_time: event.end, description: event.description,
      location: event.location,
    }, { entity_id: entityId });
    logger.log("info", {
      event: "ha.calendar.event_created", domain: "ha", component: "ha-services",
      request_id: SYS_REQ, message: `Created calendar event: ${event.summary}`,
    });
    return true;
  } catch (err) {
    logger.log("error", {
      event: "ha.calendar.create_event.failed", domain: "ha", component: "ha-services",
      request_id: SYS_REQ, message: `Failed to create calendar event: ${err}`,
    });
    return false;
  }
}

// ── Todo Services ──

export interface TodoItem {
  uid?: string;
  summary: string;
  status?: "needs_action" | "completed";
  due?: string;
  description?: string;
}

export async function addTodoItem(
  entityId: string, item: Omit<TodoItem, "uid" | "status">,
): Promise<boolean> {
  const conn = await getHAConnection();
  if (!conn) return false;
  try {
    await callService(conn, "todo", "add_item", {
      item: item.summary, due_date: item.due, description: item.description,
    }, { entity_id: entityId });
    logger.log("info", {
      event: "ha.todo.item_added", domain: "ha", component: "ha-services",
      request_id: SYS_REQ, message: `Added todo item: ${item.summary}`,
    });
    return true;
  } catch (err) {
    logger.log("error", {
      event: "ha.todo.add_item.failed", domain: "ha", component: "ha-services",
      request_id: SYS_REQ, message: `Failed to add todo item: ${err}`,
    });
    return false;
  }
}

// ── Notification Services ──

export async function sendNotification(
  target: string, title: string, message: string, data?: Record<string, unknown>,
): Promise<boolean> {
  const conn = await getHAConnection();
  if (!conn) return false;
  try {
    await callService(conn, "notify", target, { title, message, data });
    logger.log("info", {
      event: "ha.notification.sent", domain: "ha", component: "ha-services",
      request_id: SYS_REQ, message: `Sent notification to ${target}: ${title}`,
    });
    return true;
  } catch (err) {
    logger.log("error", {
      event: "ha.notification.failed", domain: "ha", component: "ha-services",
      request_id: SYS_REQ, message: `Failed to send notification: ${err}`,
    });
    return false;
  }
}

// ── Generic Service Call ──

export async function callHAService(
  domain: string, service: string,
  serviceData?: Record<string, unknown>,
  target?: { entity_id?: string | string[]; device_id?: string | string[] },
): Promise<unknown> {
  const conn = await getHAConnection();
  if (!conn) return null;
  try {
    const result = await callService(conn, domain, service, serviceData, target);
    logger.log("debug", {
      event: "ha.service.called", domain: "ha", component: "ha-services",
      request_id: SYS_REQ, message: `Called ${domain}.${service}`,
    });
    return result;
  } catch (err) {
    logger.log("error", {
      event: "ha.service.call_failed", domain: "ha", component: "ha-services",
      request_id: SYS_REQ, message: `Failed to call ${domain}.${service}: ${err}`,
    });
    return null;
  }
}
