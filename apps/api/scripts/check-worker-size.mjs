import { statSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

console.log("Building worker to measure size...");
try {
  // Use wrangler command to dry-run deploy and get output path
  execSync("pnpm exec wrangler deploy --dry-run --outdir=dist", { stdio: "inherit" });
} catch (err) {
  console.error("Failed to build worker for size check.", err);
  process.exit(1);
}

// Find worker.js in dist
const distPath = join(process.cwd(), "dist", "worker.js");

if (!existsSync(distPath)) {
  console.error(`Built worker file not found at: ${distPath}`);
  process.exit(1);
}

const stats = statSync(distPath);
const sizeMB = stats.size / (1024 * 1024);

console.log(`Worker bundle size: ${sizeMB.toFixed(2)} MB (${stats.size} bytes)`);

// Workers limit is 1MB for free tier (or 10MB after gzip, but raw script size should be small).
// Setting threshold at 1MB raw size to be extremely safe.
if (sizeMB > 1.0) {
  console.error(`❌ Error: Worker size (${sizeMB.toFixed(2)} MB) exceeds 1.0 MB threshold!`);
  process.exit(1);
} else {
  console.log(`✅ Success: Worker size is below the 1.0 MB limit.`);
  process.exit(0);
}
