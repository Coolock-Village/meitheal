import { test } from "@playwright/test";

test("passkey auth placeholder", async () => {
  test.info().annotations.push({ type: "todo", description: "Add WebAuthn registration/login flow tests" });
});
