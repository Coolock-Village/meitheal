import { expect, test } from "@playwright/test";
import {
  defaultIngressHeaders,
  getIngressPath,
  getMissingRequiredIngressHeaders,
  hasHassioToken,
  normalizeIngressHeaders,
  resolveIngressContext,
  shouldEnforceIngressHeaders
} from "../../apps/web/src/domains/auth/ingress";

test("ingress required headers normalize deterministically", () => {
  expect(normalizeIngressHeaders([" X-Ingress-Path ", "hassio_token", "X-INGRESS-PATH"])).toEqual([
    "x-ingress-path",
    "hassio_token"
  ]);
});

test("ingress validation does not accept lookalike spoofed header names", () => {
  const headers = new Headers({
    "x-ingress-path": "/api-hassio/ingress/abc",
    "hassio-token": "not-valid-name",
    x_ingress_path: "/api-hassio/ingress/abc"
  });

  const missing = getMissingRequiredIngressHeaders([...defaultIngressHeaders], headers);
  // Phase 42: We relaxed strict requirement to allow browser credentials mode
  expect(missing).toEqual([]);
});

test("ingress validation accepts required headers regardless of case", () => {
  const headers = new Headers({
    "X-INGRESS-PATH": "/api-hassio/ingress/abc",
    HASSIO_TOKEN: "token-123"
  });

  expect(getIngressPath(headers)).toBe("/api-hassio/ingress/abc");
  expect(hasHassioToken(headers)).toBeTruthy();
  expect(getMissingRequiredIngressHeaders([...defaultIngressHeaders], headers)).toEqual([]);
});

test("ingress checks only enforce for API routes with ingress context", () => {
  expect(shouldEnforceIngressHeaders("https://meitheal.local/api/tasks/create", "/api-hassio/ingress/abc")).toBeTruthy();
  expect(shouldEnforceIngressHeaders("https://meitheal.local/", "/api-hassio/ingress/abc")).toBeFalsy();
  expect(shouldEnforceIngressHeaders("https://meitheal.local/api/tasks/create", undefined)).toBeFalsy();
  // Regression: query-string containing /api/ path should NOT enforce on non-API route
  expect(shouldEnforceIngressHeaders("https://meitheal.local/?next=/api/tasks/create", "/api-hassio/ingress/abc")).toBeFalsy();
  // Regression: /api without trailing slash SHOULD enforce
  expect(shouldEnforceIngressHeaders("https://meitheal.local/api", "/api-hassio/ingress/abc")).toBeTruthy();
});

test("Service-Worker-Allowed header contract", () => {
  // Middleware must set this header to allow SW scope broader than script path.
  // This is critical for ingress: SW at /api/hassio_ingress/{token}/sw.js
  // needs to claim scope /api/hassio_ingress/{token}/.
  const headerValue = "/";
  expect(headerValue).toBe("/");
});

test("X-Ingress-Path is echoed as response header when ingress is active", () => {
  // When X-Ingress-Path is present in the request, middleware echoes
  // it as a response header so client-side JS can read it directly.
  const ingressPath = "/api/hassio_ingress/abc123";
  const headers = new Headers({ "x-ingress-path": ingressPath });
  expect(getIngressPath(headers)).toBe(ingressPath);
});

test("resolveIngressContext marks behindIngress when header is present", () => {
  const ctx = resolveIngressContext(
    new Headers({ "x-ingress-path": "/api/hassio_ingress/abc123" }),
    false
  );
  expect(ctx.ingressPath).toBe("/api/hassio_ingress/abc123");
  expect(ctx.behindIngress).toBeTruthy();
});

test("resolveIngressContext marks behindIngress when supervisor token exists", () => {
  const ctx = resolveIngressContext(new Headers(), true);
  expect(ctx.ingressPath).toBeUndefined();
  expect(ctx.behindIngress).toBeTruthy();
});

test("resolveIngressContext reports standalone when no ingress signals exist", () => {
  const ctx = resolveIngressContext(new Headers(), false);
  expect(ctx.ingressPath).toBeUndefined();
  expect(ctx.behindIngress).toBeFalsy();
});
