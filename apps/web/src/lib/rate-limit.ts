import { apiError } from "./api-response";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of store.entries()) {
      if (now > val.resetAt) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Basic in-memory rate limiter based on IP address.
 * Use for v1 compatibility routes to prevent brute force or heavy sync abuses.
 * @param request The incoming request
 * @param limit Maximum number of requests (default 100)
 * @param windowMs Time window in milliseconds (default 1 min)
 * @returns An API 429 Response if rate limit exceeded, otherwise null
 */
export function checkRateLimit(request: Request, limit = 100, windowMs = 60000): Response | null {
  const ip = request.headers.get("x-forwarded-for")?.split(',')[0] || "unknown-ip";
  const now = Date.now();
  
  let record = store.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + windowMs };
  }
  
  record.count++;
  store.set(ip, record);
  
  if (record.count > limit) {
    return apiError("Too many requests", 429);
  }
  
  return null;
}
