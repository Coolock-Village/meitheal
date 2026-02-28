import type { MiddlewareHandler } from "astro";
import { getCollection } from "astro:content";
import {
  defaultIngressHeaders,
  getIngressPath,
  getMissingRequiredIngressHeaders,
  hasHassioToken,
  normalizeIngressHeaders,
  shouldEnforceIngressHeaders
} from "@domains/auth/ingress";

let cachedRequiredHeaders: string[] | null = null;

async function getRequiredIngressHeaders(): Promise<string[]> {
  if (cachedRequiredHeaders) {
    return cachedRequiredHeaders;
  }

  try {
    const configs = await getCollection("config");
    const authEntry = configs.find((entry: (typeof configs)[number]) => entry.id === "auth");
    const configured = authEntry?.data.auth?.ingress?.required_headers;

    if (Array.isArray(configured) && configured.length > 0) {
      cachedRequiredHeaders = normalizeIngressHeaders(configured);
      return cachedRequiredHeaders;
    }
  } catch {
    // Fallback to defaults for local dev or incomplete content config.
  }

  cachedRequiredHeaders = normalizeIngressHeaders([...defaultIngressHeaders]);
  return cachedRequiredHeaders;
}

export const onRequest: MiddlewareHandler = async ({ request, locals }, next) => {
  const requiredIngressHeaders = await getRequiredIngressHeaders();
  const ingressPath = getIngressPath(request.headers);

  locals.ingressPath = ingressPath;
  locals.hassioTokenPresent = hasHassioToken(request.headers);

  // CSRF origin check for mutating API requests (defense-in-depth)
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method) && url.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host") ?? url.host;
    const isDev = import.meta.env.DEV;

    if (!isDev) {
      const originHost = origin ? new URL(origin).host : null;
      const refererHost = referer ? new URL(referer).host : null;
      const allowed = originHost === host || refererHost === host;
      if (!allowed && !origin && !referer) {
        // Allow requests with no origin/referer (e.g. curl, HA internal calls)
      } else if (!allowed) {
        return new Response(
          JSON.stringify({ error: "CSRF origin mismatch" }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }
    }
  }

  // Security response headers (OWASP best practices)
  const securityHeaders: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN", // Allow HA ingress iframe
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-XSS-Protection": "1; mode=block",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; object-src 'none'; frame-ancestors 'self'",
  };

  // For API routes that expect ingress context, fail fast if required headers are absent.
  if (shouldEnforceIngressHeaders(request.url, ingressPath)) {
    const missingHeaders = getMissingRequiredIngressHeaders(requiredIngressHeaders, request.headers);
    if (missingHeaders.length === 0) {
      const response = await next();
      // Inject security headers
      for (const [key, value] of Object.entries(securityHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    return new Response(
      JSON.stringify({
        error: "Missing required ingress headers",
        missingHeaders
      }),
      {
        status: 401,
        headers: { "content-type": "application/json", ...securityHeaders }
      }
    );
  }

  const response = await next();
  // Inject security headers on all responses
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
};
