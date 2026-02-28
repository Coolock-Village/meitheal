/**
 * Meitheal Cloud Runtime — Cloudflare Worker
 *
 * Dual-runtime entrypoint for non-HA deployments.
 * Mirrors /api/v1/* compat routes from Astro web.
 * Uses D1 for storage. Self-contained to avoid Node-only API conflicts.
 *
 * Bounded context: apps/api
 */

// --- Types ---

interface Env {
  DB: D1Database;
  MEITHEAL_VIKUNJA_API_TOKEN?: string;
  MEITHEAL_RUNTIME?: string;
}

// --- Inline Rate Limiter (Workers-compatible subset) ---

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

    // Refill tokens based on elapsed time
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

    // Evict stale buckets (simple LRU: drop oldest 10% when > 10k)
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
      return { ok: true as const, rows: result.results ?? [] };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Unknown D1 error",
      };
    }
  }

  async execute(sql: string, params: unknown[] = []) {
    try {
      const stmt = this.db.prepare(sql).bind(...params);
      await stmt.run();
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Unknown D1 error",
      };
    }
  }

  async first<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
    const stmt = this.db.prepare(sql).bind(...params);
    return stmt.first<T>();
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

// --- Auth ---

function authorizeRequest(request: Request, env: Env): boolean {
  const token = env.MEITHEAL_VIKUNJA_API_TOKEN;
  if (!token) return false;
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  return authHeader.replace(/^Bearer\s+/i, "") === token;
}

// --- Helpers ---

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
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
  if (!result.ok) return errorResponse(result.error, 500);
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
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const db = new D1QueryAdapter(env.DB);
  const result = await db.execute(
    "INSERT INTO tasks (id, title, description, status, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, body.title ?? "", body.description ?? "", "pending", body.due_date ?? null, now, now]
  );
  if (!result.ok) return errorResponse(result.error, 500);
  return jsonResponse({ id, title: body.title, status: "pending", created_at: now, updated_at: now }, 201);
});

addRoute("PUT", "/api/v1/tasks/:id", async (req, env, params) => {
  if (!authorizeRequest(req, env)) return errorResponse("Unauthorized", 401);
  const body = (await req.json()) as Record<string, unknown>;
  const now = new Date().toISOString();
  const db = new D1QueryAdapter(env.DB);
  const existing = await db.first("SELECT * FROM tasks WHERE id = ?", [params.id]);
  if (!existing) return errorResponse("Not found", 404);
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
  if (!result.ok) return errorResponse(result.error, 500);
  return jsonResponse({ ...(existing as Record<string, unknown>), ...body, updated_at: now });
});

addRoute("DELETE", "/api/v1/tasks/:id", async (req, env, params) => {
  if (!authorizeRequest(req, env)) return errorResponse("Unauthorized", 401);
  const db = new D1QueryAdapter(env.DB);
  const result = await db.execute("DELETE FROM tasks WHERE id = ?", [params.id]);
  if (!result.ok) return errorResponse(result.error, 500);
  return jsonResponse({ deleted: true });
});

// --- Worker Entrypoint ---

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // FR-401: CF-Connecting-IP for rate limiting on Cloudflare
    const clientIp = request.headers.get("cf-connecting-ip") ?? "unknown";

    // Rate limit API routes (excluding health)
    if (url.pathname.startsWith("/api/") && !url.pathname.includes("/health")) {
      const check = limiter.check(clientIp);
      if (!check.allowed) {
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
        return await matched.handler(request, env, matched.params);
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : "Internal server error",
          500
        );
      }
    }

    return errorResponse("Not found", 404);
  },
};
