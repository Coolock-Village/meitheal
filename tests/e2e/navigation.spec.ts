import { test, expect } from "@playwright/test";
import { shouldSkipBrowserSpecs } from "./_helpers";

test.describe("Responsive Navigation", () => {
  test.skip(shouldSkipBrowserSpecs(), "Set E2E_BASE_URL to run browser specs");

  test("Desktop: sidebar is visible by default, toggle is hidden", async ({ page }) => {
    // 1920x1080 is typical desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("#sidebar");
    const menuToggle = page.locator("#menu-toggle");

    await expect(sidebar).toBeVisible();
    await expect(menuToggle).not.toBeVisible();
  });

  test("Mobile: sidebar is hidden by default, toggle shows it", async ({ page }) => {
    // 375x812 is iPhone X
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("#sidebar");
    const menuToggle = page.locator("#menu-toggle");

    // The toggle button should be visible on mobile
    await expect(menuToggle).toBeVisible();

    // The sidebar should NOT be visible by default or is off-screen.
    // In our CSS, it translates offscreen (-100%) until `.open` is added.
    await expect(sidebar).not.toHaveClass(/open/);

    // Click toggle to open
    await menuToggle.click();
    await expect(sidebar).toHaveClass(/open/);

    // Click toggle to close
    await menuToggle.click();
    await expect(sidebar).not.toHaveClass(/open/);
  });
});

