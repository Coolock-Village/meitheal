import type { APIRoute } from "astro";
import { ensureSchema } from "@domains/tasks/persistence/store";

export const GET: APIRoute = async () => {
  try {
    await ensureSchema();
    return new Response(
      JSON.stringify({
        status: "ok",
        service: "meitheal-web",
        time: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        service: "meitheal-web",
        time: new Date().toISOString(),
        error: error instanceof Error ? error.message : "unknown"
      }),
      {
        status: 503,
        headers: { "content-type": "application/json" }
      }
    );
  }
};
