/**
 * Ingress-safe server wrapper for Astro standalone.
 *
 * Problem: HA Supervisor ingress can send requests with double trailing
 * slashes (e.g., //). Astro's collapseDuplicateTrailingSlashes() normalizes
 * // → / and issues a 301 redirect to "/". Behind ingress, the browser
 * follows the 301 to the HA root (http://host:8123/), causing the HA
 * dashboard to render inside the addon's iframe — an infinite recursion
 * that crashes the browser.
 *
 * Fix: This wrapper creates the HTTP server ITSELF and normalizes req.url
 * (collapsing duplicate slashes) BEFORE the request reaches Astro's
 * routing layer. ASTRO_NODE_AUTOSTART is set to "disabled" to prevent
 * Astro from creating its own competing server.
 *
 * Bounded context: auth (ingress)
 */

import http from "node:http";

// Prevent Astro standalone from auto-starting its own HTTP server.
// We create the server ourselves so we can intercept req.url first.
process.env.ASTRO_NODE_AUTOSTART = "disabled";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";

// Dynamically import the Astro entry to get the handler
const { handler } = await import("../dist/server/entry.mjs");

const server = http.createServer((req, res) => {
  // Normalize URL: collapse duplicate slashes (// → /)
  // This prevents Astro's collapseDuplicateTrailingSlashes from issuing
  // 301 redirects that escape the ingress iframe.
  if (req.url) {
    const [pathPart, ...queryParts] = req.url.split("?");
    const queryPart = queryParts.join("?"); // Preserve query string
    const normalized = pathPart.replace(/\/\/+/g, "/"); // Collapse // → /
    req.url = queryPart ? `${normalized}?${queryPart}` : normalized;
  }

  handler(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Meitheal server listening on http://${HOST}:${PORT}`);
});
