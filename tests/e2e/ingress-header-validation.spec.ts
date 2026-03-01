import { expect, test } from "@playwright/test";
import {
  defaultIngressHeaders,
  getIngressPath,
  getMissingRequiredIngressHeaders,
  hasHassioToken,
  normalizeIngressHeaders,
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
  expect(missing).toEqual(["hassio_token"]);
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
