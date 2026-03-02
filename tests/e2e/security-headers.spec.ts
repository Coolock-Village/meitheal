import { expect, test } from "@playwright/test";

/**
 * Security Headers — Integration Test
 *
 * Validates that the middleware sets correct security headers for both
 * standalone and HA ingress modes. Uses live HTTP requests against
 * the running dev server.
 *
 * @domain auth
 * @bounded-context security
 */

const BASE = process.env.MEITHEAL_TEST_URL || "http://localhost:4321";

test.describe("Security Headers (Standalone — no ingress)", () => {
  test("sets core OWASP security headers", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    const headers = res.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-xss-protection"]).toBe("1; mode=block");
    expect(headers["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()");
  });

  test("sets CSP with self-only frame-ancestors in standalone mode", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    const csp = res.headers()["content-security-policy"] ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline' data:");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  test("sets connect-src to self-only in standalone mode", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    const csp = res.headers()["content-security-policy"] ?? "";

    expect(csp).toContain("connect-src 'self'");
    // Standalone CSP must NOT include HA Supervisor origins.
    // Note: ws:/wss: may be present in dev mode for Vite HMR.
    expect(csp).not.toContain("http://supervisor");
  });

  test("includes request-id and response-time headers", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    const headers = res.headers();

    expect(headers["x-request-id"]).toBeTruthy();
    expect(headers["x-response-time"]).toMatch(/^\d+ms$/);
  });

  test("includes rate-limit headers on API routes", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    const headers = res.headers();

    expect(headers["x-ratelimit-limit"]).toBe("120");
    expect(headers["x-ratelimit-remaining"]).toBeTruthy();
    expect(headers["x-ratelimit-reset"]).toBeTruthy();
  });
});

test.describe("Security Headers (CSP policy correctness)", () => {
  test("allows Google Fonts in style-src and font-src", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    const csp = res.headers()["content-security-policy"] ?? "";

    expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(csp).toContain("font-src 'self' https://fonts.gstatic.com");
  });

  test("allows data: and blob: in img-src for attachments", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    const csp = res.headers()["content-security-policy"] ?? "";

    expect(csp).toContain("img-src 'self' data: blob:");
  });
});
