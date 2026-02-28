export default {
  async fetch(request: Request): Promise<Response> {
    if (new URL(request.url).pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, runtime: "cloudflare" }), {
        headers: { "content-type": "application/json" }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
