import { test } from "@playwright/test";

test("offline sync placeholder", async () => {
  test.info().annotations.push({ type: "todo", description: "Add service worker + IndexedDB queue replay assertions" });
});
