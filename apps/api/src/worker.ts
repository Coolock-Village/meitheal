/**
 * Meitheal Cloud Runtime — Cloudflare Worker
 *
 * Dual-runtime entrypoint for non-HA deployments.
 * Mirrors /api/v1/* compat routes from Astro web.
 * Uses D1 for storage. Self-contained to avoid Node-only API conflicts.
 *
 * Security: timingSafeEqual auth (FR-501), CSRF (FR-502), 409 stale PUT (T-503),
 *           IP hashing (T-504), D1 fallback (T-505), structured logging (T-513),
 *           domain events (T-512), GDPR deletion (T-533).
 *
 * Bounded context: apps/api
 */

// --- Types ---

interface Env {
  DB: D1Database;
  MEITHEAL_VIKUNJA_API_TOKEN?: string;
  MEITHEAL_RUNTIME?: string;
  MEITHEAL_ALLOWED_ORIGINS?: string;
}

interface DomainEvent {
  type: string;
  entityId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

// --- Structured Logger (T-513) ---

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    runtime: "cloudflare",
    ...context,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// --- Domain Event Emitter (T-512) ---

const pendingEvents: DomainEvent[] = [];

function emitEvent(type: string, entityId: string, payload: Record<string, unknown> = {}): void {
  const event: DomainEvent = {
    type,
    entityId,
    timestamp: new Date().toISOString(),
    payload,
  };
  pendingEvents.push(event);
  log("info", `domain.event.${type}`, { entityId, eventType: type });
}

// --- Inline Rate Limiter (Workers-compatible, IP hashing T-504) ---

interface Bucket {
  tokens: number;
  lastRefill: number;
}

class WorkerRateLimiter {
  private readonly capacity: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, Bucket>();

  constructor(capacity = 100, windowMs = 60_000) {
    this.capacity = capacity;
    this.windowMs = windowMs;
  }

  check(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    const elapsed = now - bucket.lastRefill;
    const refill = Math.floor((elapsed / this.windowMs) * this.capacity);
    if (refill > 0) {
      bucket.tokens = Math.min(this.capacity, bucket.tokens + refill);
      bucket.lastRefill = now;
    }

    if (bucket.tokens > 0) {
      bucket.tokens--;
      return { allowed: true, remaining: bucket.tokens };
    }

    if (this.buckets.size > 10_000) {
      const entries = [...this.buckets.entries()];
      entries.sort((a, b) => a[1].lastRefill - b[1].lastRefill);
      for (let i = 0; i < 1_000; i++) {
        this.buckets.delete(entries[i]![0]);
      }
    }

    return { allowed: false, remaining: 0 };
  }
}

// --- IP Hashing (T-504, FR-501) ---

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const arr = new Uint8Array(hash);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

// --- Inline Runtime Detection ---

function detectRuntime(env?: Record<string, unknown>): { runtime: string; dbType: string } {
  if (env && (env.MEITHEAL_RUNTIME === "cloudflare" || env.CF_PAGES !== undefined)) {
    return { runtime: "cloudflare", dbType: "d1" };
  }
  return { runtime: "standalone", dbType: "sqlite" };
}

// --- Inline D1 Adapter ---

class D1QueryAdapter {
  constructor(private readonly db: D1Database) {}

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
    try {
      const stmt = this.db.prepare(sql).bind(...params);
      const result = await stmt.all<T>();
      return { ok: true as const, rows: result.results ?? [], d1Down: false as const };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown D1 error";
      // T-505: D1 unavailability detection
      if (msg.includes("D1_ERROR") || msg.includes("no such table") || msg.includes("SQLITE_")) {
        log("error", "d1.unavailable", { error: msg, sql: sql.slice(0, 50) });
      }
      return { ok: false as const, error: msg, d1Down: msg.includes("D1_ERROR") };
    }
  }

  async execute(sql: string, params: unknown[] = []) {
    try {
      const stmt = this.db.prepare(sql).bind(...params);
      await stmt.run();
      return { ok: true as const, d1Down: false as const };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown D1 error";
      const d1Down = msg.includes("D1_ERROR");
      if (d1Down) log("error", "d1.unavailable", { error: msg });
      return { ok: false as const, error: msg, d1Down };
    }
  }

  async first<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
    try {
      const stmt = this.db.prepare(sql).bind(...params);
      return stmt.first<T>();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown D1 error";
      log("error", "d1.first.failed", { error: msg });
      return null;
    }
  }
}

// --- Rate Limiter Instance ---

const limiter = new WorkerRateLimiter(100, 60_000);

// --- Router ---

type RouteHandler = (
  request: Request,
  env: Env,
  params: Record<string, string>
) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

const routes: Route[] = [];

function addRoute(method: string, path: string, handler: RouteHandler): void {
  const paramNames: string[] = [];
  const pattern = path.replace(/:(\w+)/g, (_, name: string) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  routes.push({ method, pattern: new RegExp(`^${pattern}$`), paramNames, handler });
}

function matchRoute(
  method: string,
  pathname: string
): { handler: RouteHandler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method && route.method !== "ALL") continue;
    const match = pathname.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1]!;
      });
      return { handler: route.handler, params };
    }
  }
  return null;
}

// --- Auth: Constant-Time Compare (T-501, FR-501) ---

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i]! ^ bufB[i]!;
  }
  return result === 0;
}

function authorizeRequest(request: Request, env: Env): boolean {
  const token = env.MEITHEAL_VIKUNJA_API_TOKEN;
  if (!token) return false;
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "");
  return timingSafeEqual(bearerToken, token);
}

// --- CSRF Protection (T-502, FR-502) ---

function validateCsrf(request: Request, env: Env): boolean {
  const method = request.method;
  // Safe methods don't need CSRF validation
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

  // Check Sec-Fetch-Site header (FR-502: strongest signal)
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    log("warn", "csrf.rejected", { secFetchSite, method });
    return false;
  }

  // Check Origin header
  const origin = request.headers.get("origin");
  if (origin) {
    const allowedOrigins = (env.MEITHEAL_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map(o => o.trim())
      .filter(Boolean);
    // Allow if no origins configured (dev mode) — but log warning
    if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
      log("warn", "csrf.origin.rejected", { origin, method });
      return false;
    }
    if (allowedOrigins.length === 0) {
      log("warn", "csrf.no_origins_configured", { method });
    }
  }

  return true;
}

// --- Helpers ---

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}

function errorResponse(message: string, status: number, extraHeaders: Record<string, string> = {}): Response {
  return jsonResponse({ error: message }, status, extraHeaders);
}

// T-505: D1 unavailability returns 503
function d1ErrorResponse(error: string, d1Down?: boolean): Response {
  if (d1Down) {
    return errorResponse("Service temporarily unavailable", 503, { "retry-after": "30" });
  }
  return errorResponse(error, 500);
}

// --- Route Handlers ---

addRoute("GET", "/health", async () =>
  jsonResponse({ ok: true, runtime: "cloudflare" })
);

addRoute("GET", "/api/health", async () =>
  jsonResponse({ ok: true, runtime: "cloudflare" })
);

addRoute("GET", "/api/runtime", async (_req, env) =>
  jsonResponse(detectRuntime(env as unknown as Record<string, unknown>))
);

addRoute("GET", "/api/v1/tasks", async (req, env) => {
  if (!authorizeRequest(req, env)) return errorResponse("Unauthorized", 401);
  const db = new D1QueryAdapter(env.DB);
  const result = await db.query("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 100");
  if (!result.ok) return d1ErrorResponse(result.error, result.d1Down);
  return jsonResponse(result.rows);
});

addRoute("GET", "/api/v1/tasks/:id", async (req, env, params) => {
  if (!authorizeRequest(req, env)) return errorResponse("Unauthorized", 401);
  const db = new D1QueryAdapter(env.DB);
  const task = await db.first("SELECT * FROM tasks WHERE id = ?", [params.id]);
  if (!task) return errorResponse("Not found", 404);
  return jsonResponse(task);
});

addRoute("POST", "/api/v1/tasks", async (req, env) => {
  if (!authorizeRequest(req, env)) return errorResponse("Unauthorized", 401);
  const body = (await req.json()) as Record<string, unknown>;
  // Validate required title field
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return errorResponse("title is required and must be non-empty", 400);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const db = new D1QueryAdapter(env.DB);
  const result = await db.execute(
    "INSERT INTO tasks (id, title, description, status, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, title, body.description ?? "", "pending", body.due_date ?? null, now, now]
  );
  if (!result.ok) return d1ErrorResponse(result.error, result.d1Down);
  emitEvent("task.created", id, { title });
  return jsonResponse({ id, title, status: "pending", created_at: now, updated_at: now }, 201);
});

// T-503: Stale update detection with If-Match / updated_at
addRoute("PUT", "/api/v1/tasks/:id", async (req, env, params) => {
  if (!authorizeRequest(req, env)) return errorResponse("Unauthorized", 401);
  const body = (await req.json()) as Record<string, unknown>;
  const now = new Date().toISOString();
  const db = new D1QueryAdapter(env.DB);
  const existing = await db.first("SELECT * FROM tasks WHERE id = ?", [params.id]);
  if (!existing) return errorResponse("Not found", 404);

  // T-503: Reject stale updates — If-Match or body.updated_at must match current
  const clientUpdatedAt = (req.headers.get("if-match") ?? body.updated_at) as string | undefined;
  const serverUpdatedAt = (existing as Record<string, unknown>).updated_at as string;
  if (clientUpdatedAt && clientUpdatedAt !== serverUpdatedAt) {
    log("warn", "task.conflict", { taskId: params.id, clientUpdatedAt, serverUpdatedAt });
    return jsonResponse(
      { error: "Conflict: task has been modified", current: existing },
      409
    );
  }

  const result = await db.execute(
    "UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ?, updated_at = ? WHERE id = ?",
    [
      body.title ?? (existing as Record<string, unknown>).title,
      body.description ?? (existing as Record<string, unknown>).description,
      body.status ?? (existing as Record<string, unknown>).status,
      body.due_date ?? (existing as Record<string, unknown>).due_date,
      now, params.id,
    ]
  );
  if (!result.ok) return d1ErrorResponse(result.error, result.d1Down);
  emitEvent("task.updated", params.id!, { fields: Object.keys(body) });
  return jsonResponse({ ...(existing as Record<string, unknown>), ...body, updated_at: now });
});

addRoute("DELETE", "/api/v1/tasks/:id", async (req, env, params) => {
  if (!authorizeRequest(req, env)) return errorResponse("Unauthorized", 401);
  const db = new D1QueryAdapter(env.DB);
  const result = await db.execute("DELETE FROM tasks WHERE id = ?", [params.id]);
  if (!result.ok) return d1ErrorResponse(result.error, result.d1Down);
  emitEvent("task.deleted", params.id!);
  return jsonResponse({ deleted: true });
});

// T-533: GDPR data deletion endpoint (FR-506: hard delete, audit event BEFORE deletion)
addRoute("DELETE", "/api/v1/user/data", async (req, env) => {
  if (!authorizeRequest(req, env)) return errorResponse("Unauthorized", 401);
  emitEvent("user.data.deletion.requested", "all", { initiator: "user" });
  const db = new D1QueryAdapter(env.DB);
  const result = await db.execute("DELETE FROM tasks");
  if (!result.ok) return d1ErrorResponse(result.error, result.d1Down);
  emitEvent("user.data.deleted", "all");
  log("info", "gdpr.data.deleted", { tables: ["tasks"] });
  return jsonResponse({
    deleted: true,
    message: "All user data has been permanently deleted. Clear browser IndexedDB for local cleanup.",
  });
});

// --- Worker Entrypoint ---

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // T-502: CSRF validation for mutating requests
    if (!validateCsrf(request, env)) {
      return errorResponse("CSRF validation failed", 403);
    }

    // T-504: Hash IP before using as rate limit key
    const rawIp = request.headers.get("cf-connecting-ip") ?? "unknown";
    const hashedIp = await hashIp(rawIp);

    // Rate limit API routes (excluding health)
    if (url.pathname.startsWith("/api/") && !url.pathname.includes("/health")) {
      const check = limiter.check(hashedIp);
      if (!check.allowed) {
        log("warn", "rate.limit.exceeded", { hashedIp });
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: {
            "content-type": "application/json",
            "x-ratelimit-remaining": String(check.remaining),
          },
        });
      }
    }

    const matched = matchRoute(request.method, url.pathname);
    if (matched) {
      try {
        const response = await matched.handler(request, env, matched.params);
        // Log structured request
        log("info", "request.handled", {
          method: request.method,
          path: url.pathname,
          status: response.status,
        });
        return response;
      } catch (error) {
        log("error", "request.unhandled_error", {
          method: request.method,
          path: url.pathname,
          error: error instanceof Error ? error.message : "Unknown",
        });
        return errorResponse(
          error instanceof Error ? error.message : "Internal server error",
          500
        );
      }
    }

    return errorResponse("Not found", 404);
  },
};
