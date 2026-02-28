import { test } from "@playwright/test";

test("security headers placeholder", async () => {
  test.info().annotations.push({ type: "todo", description: "Assert CSP/HSTS headers once middleware is finalized" });
});
