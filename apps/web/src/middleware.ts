import type { MiddlewareHandler } from "astro";
import {
  getHassUserId,
  getIngressPath,
  hasHassioToken,
  isHassAdmin,
} from "@domains/auth/ingress";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";
import { getPersistenceClient, ensureSchema } from "@domains/tasks/persistence/store";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["tasks", "audit", "observability"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: true,
});



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

/**
 * Rewrite absolute paths in HTML responses when behind HA ingress.
 * The ingress proxy maps /{ingressPath}/* → http://addon:port/*
 * but if the HTML contains absolute paths like href="/tasks" or src="/_astro/page.js",
 * the browser resolves them against the HA root, bypassing ingress → 404.
 *
 * This rewrites ALL href="/...", src="/...", and action="/..." attributes
 * to include the ingress path prefix.
 */
async function rewriteIngressPaths(response: Response, ingressPath: string): Promise<Response> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  const html = await response.text();

  // Inject runtime ingress path for client-side JS (must come before any scripts)
  const ingressScript = `<script>window.__ingress_path="${ingressPath}";</script>`;

  // Rewrite absolute paths in HTML attributes: href="/...", src="/...", action="/..."
  // Matches: href="/path", src="/path", action="/path" (with double or single quotes)
  // Does NOT match: href="//cdn.example.com" (protocol-relative), href="http://..." (absolute URL)
  const rewritten = html
    .replace("<head>", `<head>${ingressScript}`)
    .replace(/((?:href|src|action)=["'])\/(?!\/)/g, `$1${ingressPath}/`);

  return new Response(rewritten, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export const onRequest: MiddlewareHandler = async ({ request, locals }, next) => {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const ingressPath = getIngressPath(request.headers);

  locals.ingressPath = ingressPath;
  locals.hassioTokenPresent = hasHassioToken(request.headers);

  // Extract authenticated HA user identity from Supervisor ingress headers
  locals.hassUserId = getHassUserId(request.headers);
  locals.hassIsAdmin = isHassAdmin(request.headers);

  // Load regional settings for SSR
  locals.timezone = "Europe/Dublin";
  locals.weekStart = "monday";
  locals.dateFormat = "relative";
  try {
    await ensureSchema();
    const db = getPersistenceClient();
    const res = await db.execute("SELECT key, value FROM settings WHERE key IN ('timezone', 'week_start', 'date_format')");
    for (const row of res.rows) {
      if (row.key === "timezone" && typeof row.value === "string") locals.timezone = row.value;
      if (row.key === "week_start" && typeof row.value === "string") locals.weekStart = row.value;
      if (row.key === "date_format" && typeof row.value === "string") locals.dateFormat = row.value;
    }
  } catch {
    /* ignore db errors, defaults used */
  }

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
      // Behind ingress, Origin is the HA frontend host (e.g., 192.168.88.250:8123)
      // but Host is the addon container. Skip CSRF check since the Supervisor already
      // validated the ingress session before forwarding the request.
      const allowed = ingressPath || originHost === host || refererHost === host;
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
  // When accessed via HA ingress, the Supervisor validates the session
  // before proxying — use permissive frame-ancestors since users access
  // HA by IP, hostname, or custom domain (all would need whitelisting).
  const frameAncestors = ingressPath ? "*" : "'self'";

  const securityHeaders: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    // X-Frame-Options: ALLOW-FROM is deprecated and unsupported in modern
    // browsers. When behind ingress, omit it entirely — CSP frame-ancestors
    // handles the policy. For standalone, use SAMEORIGIN.
    ...(!ingressPath ? { "X-Frame-Options": "SAMEORIGIN" } : {}),
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-XSS-Protection": "1; mode=block",
    "Content-Security-Policy": [
      "default-src 'self'",
      // data: needed for Astro ClientRouter navigation scripts
      "script-src 'self' 'unsafe-inline' data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",  // blob: for attachment previews
      "font-src 'self' https://fonts.gstatic.com",
      ingressPath
        ? "connect-src 'self' ws: wss: http://supervisor http://supervisor:*"
        : "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      `frame-ancestors ${frameAncestors}`,
    ].join("; "),
  };

  // HA Supervisor already validates ingress sessions before proxying requests.
  // No additional auth enforcement needed on our side.

  let response = await next();
  // Rewrite HTML paths when behind HA ingress
  if (ingressPath) {
    response = await rewriteIngressPaths(response, ingressPath);
  }
  // Inject security + observability headers on all responses
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-response-time", `${Date.now() - startTime}ms`);
  if (url.pathname.startsWith("/api/")) {
    applyRateLimitHeaders(response, rateInfo.remaining, rateInfo.resetAt);
    const elapsed = Date.now() - startTime;
    if (elapsed > 1000) {
      logger.log("warn", {
        event: "http.slow_request",
        domain: "observability",
        component: "middleware",
        request_id: requestId,
        message: `Slow API request: ${request.method} ${url.pathname} took ${elapsed}ms`,
      });
    }
  }
  return response;
};
