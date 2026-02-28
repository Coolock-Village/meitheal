import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async ({ request, locals }, next) => {
  const ingressPath = request.headers.get("x-ingress-path") ?? undefined;
  const hassioToken = request.headers.get("hassio_token");

  locals.ingressPath = ingressPath;
  locals.hassioTokenPresent = Boolean(hassioToken);

  // For API routes that expect ingress context, fail fast if required headers are absent.
  if (request.url.includes("/api/") && !hassioToken && ingressPath) {
    return new Response(JSON.stringify({ error: "Missing HASSIO_TOKEN for ingress request" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  return next();
};
