import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const repoRoot = join(process.cwd(), "..");

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "SKILL.md",
  "WEBMCP.md",
  ".zeroclaw/soul.md",
  ".skills/core-workflows/SKILL.md",
  "docs/decisions/0001-legal-and-naming-strategy.md",
  "docs/decisions/0002-target-architecture.md",
  "docs/kcs/operations-runbook.md",
  "public/.well-known/mcp.json",
  "public/.well-known/jsondoc.json"
];

test("required governance files exist", () => {
  for (const file of requiredFiles) {
    expect(existsSync(join(repoRoot, file)), `Missing ${file}`).toBeTruthy();
  }
});

test("readme enforces Astro and HA first principles", () => {
  const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
  expect(readme).toContain("Astro first/native");
  expect(readme).toContain("Home Assistant");
  expect(readme).toContain("DDD");
});
