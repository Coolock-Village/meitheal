import { test } from "@playwright/test";

test("integration webhooks placeholder", async () => {
  test.info().annotations.push({ type: "todo", description: "Validate Grocy/Calendar webhook emission" });
});
