import { expect, test } from "@playwright/test";
import { shouldSkipBrowserSpecs } from "./_helpers";

test.skip(shouldSkipBrowserSpecs(), "Set E2E_BASE_URL to run API endpoint checks");

test("well-known API contract exists", async ({ request, baseURL }) => {
  const response = await request.get(`${baseURL}/.well-known/jsondoc.json`);
  expect(response.ok()).toBeTruthy();
});
