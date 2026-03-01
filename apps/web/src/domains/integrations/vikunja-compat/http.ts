import { authorizeCompatibilityRequest } from "./auth";
import { checkRateLimit } from "../../../lib/rate-limit";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}

export function parsePositiveInt(value: string | undefined | null): number | null {
  if (!value || value.trim().length === 0) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function requireCompatibilityAuth(request: Request): Response | null {
  const rateLimitResponse = checkRateLimit(request, 100, 60000);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const auth = authorizeCompatibilityRequest(request);
  if (auth instanceof Response) {
    return auth;
  }
  return null;
}

export function requestIdFrom(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function idempotencyKeyFrom(request: Request): string {
  return request.headers.get("idempotency-key") ?? requestIdFrom(request);
}
