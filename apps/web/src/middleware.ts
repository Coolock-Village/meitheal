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

// ── In-memory rate limiter (R-107) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 120; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function getRateLimit(ip: string): { remaining: number; resetAt: number; exceeded: boolean } {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateLimitMap.set(ip, entry);
  }
  entry.count++;
  const remaining = Math.max(0, RATE_LIMIT - entry.count);
  return { remaining, resetAt: entry.resetAt, exceeded: entry.count > RATE_LIMIT };
}

// Periodic cleanup (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now >= entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

function applyRateLimitHeaders(response: Response, remaining: number, resetAt: number): void {
  response.headers.set("x-ratelimit-limit", String(RATE_LIMIT));
  response.headers.set("x-ratelimit-remaining", String(remaining));
  response.headers.set("x-ratelimit-reset", String(Math.ceil(resetAt / 1000)));
}

export const onRequest: MiddlewareHandler = async ({ request, locals }, next) => {
  const requiredIngressHeaders = await getRequiredIngressHeaders();
  const ingressPath = getIngressPath(request.headers);

  locals.ingressPath = ingressPath;
  locals.hassioTokenPresent = hasHassioToken(request.headers);

  // Rate limiting (API routes only)
  const url = new URL(request.url);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "127.0.0.1";
  const rateInfo = getRateLimit(ip);

  if (rateInfo.exceeded && url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(Math.ceil((rateInfo.resetAt - Date.now()) / 1000)),
        "x-ratelimit-limit": String(RATE_LIMIT),
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(Math.ceil(rateInfo.resetAt / 1000)),
      },
    });
  }

  // CSRF origin check for mutating API requests (defense-in-depth)
  const method = request.method.toUpperCase();
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
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",  // Astro hydration requires unsafe-inline
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",  // blob: for attachment previews
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
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
      if (url.pathname.startsWith("/api/")) applyRateLimitHeaders(response, rateInfo.remaining, rateInfo.resetAt);
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
  if (url.pathname.startsWith("/api/")) applyRateLimitHeaders(response, rateInfo.remaining, rateInfo.resetAt);
  return response;
};
