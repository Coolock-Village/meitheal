import { expect, test } from "@playwright/test";
import { shouldSkipBrowserSpecs } from "./_helpers";

test.skip(shouldSkipBrowserSpecs(), "Set E2E_BASE_URL to run .well-known checks");

test("mcp discovery file exists", async ({ request, baseURL }) => {
  const response = await request.get(`${baseURL}/.well-known/mcp.json`);
  expect(response.ok()).toBeTruthy();
});
