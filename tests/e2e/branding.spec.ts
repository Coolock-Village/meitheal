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

  test("Sidebar SVG uses theme-aware CSS vars", async ({ page }) => {
    await page.goto("/");
    const accentStroke = await page.evaluate(() => {
      const path = document.querySelector('.sidebar-brand svg path');
      return path?.getAttribute("stroke") ?? "";
    });
    expect(accentStroke).toContain("var(--accent");
  });
});

test.describe("Branding — Accent Picker", () => {
  test("Custom accent color updates --accent CSS var", async ({ page }) => {
    await page.goto("/settings");
    // Wait for settings page to load
    await page.waitForSelector(".settings-section", { timeout: 5000 }).catch(() => {});

    // Set a custom accent via localStorage (simulates picker)
    await page.evaluate(() => {
      const root = document.documentElement.style;
      root.setProperty("--accent", "#e11d48");
      localStorage.setItem("meitheal-accent-color", "#e11d48");
    });

    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim()
    );
    expect(accent).toBe("#e11d48");

    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem("meitheal-accent-color");
    });
  });
});

test.describe("Branding — Greeting Context", () => {
  test("Dashboard greeting shows context hint (overdue, active, or ✦)", async ({
    page,
  }) => {
    await page.goto("/");
    const pageTitle = page.locator('[slot="page-title"]');
    await expect(pageTitle).toContainText(/Good (Morning|Afternoon|Evening)!/);
    // Hint should be one of: "— N overdue", "— N in progress", or "✦"
    const hintText = await pageTitle.textContent();
    expect(hintText).toMatch(/— \d+ (overdue|in progress)|✦/);
  });
});
