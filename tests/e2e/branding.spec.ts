import { expect, test } from "@playwright/test";
import { shouldSkipBrowserSpecs } from "./_helpers";

test.skip(shouldSkipBrowserSpecs(), "Set E2E_BASE_URL to run browser specs");

test.describe("Branding — Typography", () => {
  test("Outfit font is loaded for headings", async ({ page }) => {
    await page.goto("/");
    const outfitLoaded = await page.evaluate(() =>
      document.fonts.check("700 12px Outfit")
    );
    expect(outfitLoaded).toBe(true);
  });

  test("Geist Variable font is loaded for body text", async ({ page }) => {
    await page.goto("/");
    const geistLoaded = await page.evaluate(() =>
      document.fonts.check('400 12px "Geist Variable"')
    );
    expect(geistLoaded).toBe(true);
  });
});

test.describe("Branding — Color Tokens", () => {
  test("--bg-primary uses Slate 900 (#0F172A = rgb 15,23,42)", async ({
    page,
  }) => {
    await page.goto("/");
    const bgPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bg-primary")
        .trim()
    );
    expect(bgPrimary).toBe("#0F172A");
  });

  test("--accent uses Indigo 500 (#6366F1 = rgb 99,102,241)", async ({
    page,
  }) => {
    await page.goto("/");
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim()
    );
    expect(accent).toBe("#6366F1");
  });
});

test.describe("Branding — Logo", () => {
  test("Village Hub SVG logo is visible in sidebar", async ({ page }) => {
    await page.goto("/");
    const logo = page.locator(
      '.sidebar-brand svg[viewBox="0 0 100 100"]'
    );
    await expect(logo).toBeVisible();
  });
});
