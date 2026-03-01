import { expect, test } from "@playwright/test";
import { authorizeCompatibilityRequest, clearTokenCacheForTest } from "../../apps/web/src/domains/integrations/vikunja-compat/auth";

test.beforeEach(() => {
  clearTokenCacheForTest();
});

test("compat auth rejects when no tokens are configured", async () => {
  delete process.env.MEITHEAL_VIKUNJA_API_TOKEN;
  delete process.env.MEITHEAL_VIKUNJA_API_TOKENS;

  const response = authorizeCompatibilityRequest(new Request("http://meitheal.local/api/v1/projects"));
  expect(response instanceof Response).toBeTruthy();
  if (response instanceof Response) {
    expect(response.status).toBe(503);
  }
});

test("compat auth accepts configured bearer token", () => {
  process.env.MEITHEAL_VIKUNJA_API_TOKEN = "token-123";
  delete process.env.MEITHEAL_VIKUNJA_API_TOKENS;

  const result = authorizeCompatibilityRequest(
    new Request("http://meitheal.local/api/v1/projects", {
      headers: { authorization: "Bearer token-123" }
    })
  );

  expect(result instanceof Response).toBeFalsy();
  if (!(result instanceof Response)) {
    expect(result.ok).toBeTruthy();
  }
});

test("compat auth rejects invalid bearer token", async () => {
  process.env.MEITHEAL_VIKUNJA_API_TOKEN = "token-abc";

  const response = authorizeCompatibilityRequest(
    new Request("http://meitheal.local/api/v1/projects", {
      headers: { authorization: "Bearer token-wrong" }
    })
  );

  expect(response instanceof Response).toBeTruthy();
  if (response instanceof Response) {
    expect(response.status).toBe(401);
  }
});
