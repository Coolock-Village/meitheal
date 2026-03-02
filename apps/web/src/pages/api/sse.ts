/**
 * Server-Sent Events Endpoint
 *
 * Streams real-time updates to the browser:
 *  - Task CRUD events (from API mutations)
 *  - Calendar changes (from HA entity subscription)
 *  - HA entity state changes (from server-side WS)
 *  - Connectivity status
 *
 * The browser connects via EventSource through ingress (session cookie auto-included).
 *
 * GET /api/sse
 *
 * @domain ha
 * @bounded-context integration
 */
import type { APIRoute } from "astro";
import { onEntityChange, getCalendarEntities, getTodoEntities } from "../../domains/ha";

// ── SSE Client Registry ──
const clients: Set<WritableStreamDefaultWriter<Uint8Array>> = new Set();

function broadcast(event: string, data: unknown): void {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);
  for (const client of clients) {
    try { client.write(encoded).catch(() => clients.delete(client)); }
    catch { clients.delete(client); }
  }
}

// Export for use by API mutation handlers
export function emitSSE(event: string, data: unknown): void {
  broadcast(event, data);
}

export const GET: APIRoute = async ({ request }) => {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  clients.add(writer);

  // Send initial connection confirmation
  const hello = new TextEncoder().encode(`event: connected\ndata: ${JSON.stringify({ ts: new Date().toISOString(), clients: clients.size })}\n\n`);
  await writer.write(hello);

  // Subscribe to HA entity changes and forward as SSE events
  const unsubscribers: (() => void)[] = [];

  // Auto-subscribe to all calendar entities
  for (const cal of getCalendarEntities()) {
    const unsub = onEntityChange(cal.entity_id, (entity) => {
      broadcast("ha:entity_changed", {
        entity_id: entity.entity_id,
        state: entity.state,
        attributes: entity.attributes,
        last_updated: entity.last_updated,
      });
    });
    unsubscribers.push(unsub);
  }

  // Auto-subscribe to all todo entities
  for (const todo of getTodoEntities()) {
    const unsub = onEntityChange(todo.entity_id, (entity) => {
      broadcast("ha:entity_changed", {
        entity_id: entity.entity_id,
        state: entity.state,
        attributes: entity.attributes,
        last_updated: entity.last_updated,
      });
    });
    unsubscribers.push(unsub);
  }

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    const beat = new TextEncoder().encode(`: heartbeat ${Date.now()}\n\n`);
    writer.write(beat).catch(() => {
      clearInterval(heartbeat);
      clients.delete(writer);
      unsubscribers.forEach((u) => u());
    });
  }, 30_000);

  // Clean up on disconnect
  request.signal.addEventListener("abort", () => {
    clearInterval(heartbeat);
    clients.delete(writer);
    unsubscribers.forEach((u) => u());
    writer.close().catch(() => {});
  });

  return new Response(readable, {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
      "x-accel-buffering": "no", // Disable nginx buffering
    },
  });
};
