import { test } from "@playwright/test";
import { shouldSkipBrowserSpecs } from "./_helpers";

test.skip(shouldSkipBrowserSpecs(), "Set E2E_BASE_URL to run browser specs");

test("navigation shell placeholder", async () => {
  test.info().annotations.push({ type: "todo", description: "Add navigation assertions after first UI slice" });
});
