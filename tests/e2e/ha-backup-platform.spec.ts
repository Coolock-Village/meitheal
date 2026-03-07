/**
 * HA Backup Platform — E2E Test
 *
 * Validates that Meitheal implements the Home Assistant backup platform
 * correctly across both the addon and custom component layers.
 *
 * @see https://developers.home-assistant.io/docs/core/platform/backup/#adding-support
 * @see https://developers.home-assistant.io/docs/add-ons/configuration#optional-configuration-options
 */
import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const repoRoot = path.join(process.cwd(), "..");
const COMPONENT_DIR = path.join(
  repoRoot,
  "integrations/home-assistant/custom_components/meitheal",
);
const ADDON_DIR = path.join(repoRoot, "meitheal-hub");

// ─── Custom Component: backup.py ────────────────────────────────────────────

test.describe("HA Backup Platform — Custom Component", () => {
  test("backup.py exists", () => {
    expect(fs.existsSync(path.join(COMPONENT_DIR, "backup.py"))).toBe(true);
  });

  test("backup.py implements async_pre_backup", () => {
    const src = fs.readFileSync(
      path.join(COMPONENT_DIR, "backup.py"),
      "utf-8",
    );
    expect(src).toContain("async def async_pre_backup");
    expect(src).toContain("hass: HomeAssistant");
  });

  test("backup.py implements async_post_backup", () => {
    const src = fs.readFileSync(
      path.join(COMPONENT_DIR, "backup.py"),
      "utf-8",
    );
    expect(src).toContain("async def async_post_backup");
  });

  test("backup.py calls addon backup/prepare endpoint", () => {
    const src = fs.readFileSync(
      path.join(COMPONENT_DIR, "backup.py"),
      "utf-8",
    );
    expect(src).toContain("/api/backup/prepare");
  });

  test("backup.py calls addon backup/complete endpoint", () => {
    const src = fs.readFileSync(
      path.join(COMPONENT_DIR, "backup.py"),
      "utf-8",
    );
    expect(src).toContain("/api/backup/complete");
  });

  test("backup.py uses async_get_clientsession (IQS inject-websession)", () => {
    const src = fs.readFileSync(
      path.join(COMPONENT_DIR, "backup.py"),
      "utf-8",
    );
    expect(src).toContain("async_get_clientsession");
  });
});

// ─── Addon: config.yaml ─────────────────────────────────────────────────────

test.describe("HA Backup Platform — Addon Config", () => {
  test("config.yaml declares hot backup", () => {
    const config = fs.readFileSync(
      path.join(ADDON_DIR, "config.yaml"),
      "utf-8",
    );
    expect(config).toContain("backup: hot");
  });

  test("config.yaml has backup_pre script path", () => {
    const config = fs.readFileSync(
      path.join(ADDON_DIR, "config.yaml"),
      "utf-8",
    );
    expect(config).toContain("backup_pre:");
    expect(config).toContain("backup-pre.sh");
  });

  test("config.yaml has backup_post script path", () => {
    const config = fs.readFileSync(
      path.join(ADDON_DIR, "config.yaml"),
      "utf-8",
    );
    expect(config).toContain("backup_post:");
    expect(config).toContain("backup-post.sh");
  });

  test("backup-pre.sh exists and is executable", () => {
    const scriptPath = path.join(
      ADDON_DIR,
      "rootfs/etc/services.d/meitheal/backup-pre.sh",
    );
    expect(fs.existsSync(scriptPath)).toBe(true);
    const stat = fs.statSync(scriptPath);
    // Check executable bit (owner)
    expect(stat.mode & 0o100).toBeTruthy();
  });

  test("backup-post.sh exists and is executable", () => {
    const scriptPath = path.join(
      ADDON_DIR,
      "rootfs/etc/services.d/meitheal/backup-post.sh",
    );
    expect(fs.existsSync(scriptPath)).toBe(true);
    const stat = fs.statSync(scriptPath);
    expect(stat.mode & 0o100).toBeTruthy();
  });

  test("backup_exclude covers logs and temp files", () => {
    const config = fs.readFileSync(
      path.join(ADDON_DIR, "config.yaml"),
      "utf-8",
    );
    expect(config).toContain("backup_exclude:");
    expect(config).toContain("*.log");
    expect(config).toContain("*.tmp");
  });
});

// ─── Addon: Backup API Endpoints ────────────────────────────────────────────

test.describe("HA Backup Platform — API Endpoints", () => {
  test("prepare.ts API route exists", () => {
    const apiPath = path.join(
      repoRoot,
      "apps/web/src/pages/api/backup/prepare.ts",
    );
    expect(fs.existsSync(apiPath)).toBe(true);
    const src = fs.readFileSync(apiPath, "utf-8");
    expect(src).toContain("wal_checkpoint");
    expect(src).toContain("POST");
  });

  test("complete.ts API route exists", () => {
    const apiPath = path.join(
      repoRoot,
      "apps/web/src/pages/api/backup/complete.ts",
    );
    expect(fs.existsSync(apiPath)).toBe(true);
    const src = fs.readFileSync(apiPath, "utf-8");
    expect(src).toContain("POST");
  });
});
