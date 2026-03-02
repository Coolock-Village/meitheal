import type { APIRoute } from "astro";
import { askAssist } from "../../../domains/ha/ha-services";
import { getHAConnectionStatus } from "../../../domains/ha/ha-connection";
import { logApiError } from "../../../lib/api-logger";

export const POST: APIRoute = async ({ request }) => {
  const status = getHAConnectionStatus();
  if (!status.connected) {
    return new Response(
      JSON.stringify({ error: "Home Assistant WebSocket disconnected" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    if (!body?.text || typeof body.text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'text' property" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const speech = await askAssist(body.text);

    return new Response(
      JSON.stringify({ speech: speech ?? "Done." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    logApiError("ha-assist", "Failed to proxy assist request", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
