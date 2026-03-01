import { authorizeCompatibilityRequest } from "./auth";
import { checkRateLimit } from "../../../lib/rate-limit";

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
