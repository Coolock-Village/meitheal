/**
 * Ingress-safe server wrapper for Astro standalone.
 *
 * Problems solved:
 *
 * 1. DOUBLE SLASH NORMALIZATION
 *    HA Supervisor ingress can send requests with double trailing slashes
 *    (e.g., //). Astro's collapseDuplicateTrailingSlashes() normalizes
 *    // → / and issues a 301 redirect to "/". Behind ingress, the browser
 *    follows the 301 to the HA root, causing the HA dashboard to render
 *    inside the addon's iframe — an infinite recursion.
 *
 * 2. MISSING X-INGRESS-PATH HEADER
 *    HA Supervisor forwards client headers but does NOT inject
 *    X-Ingress-Path itself — that header comes from the HA frontend
 *    iframe manager. When the header is absent (common for subsequent
 *    navigations, health checks, etc.), the middleware can't rewrite
 *    paths, so all links point to "/" which escapes the ingress iframe.
 *
 *    Fix: At startup, we query the Supervisor API for this addon's
 *    ingress_url, extract the path prefix, and inject X-Ingress-Path
 *    on every request that doesn't already have it.
 *
 * Bounded context: auth (ingress)
 */

import http from "node:http";

// Prevent Astro standalone from auto-starting its own HTTP server.
process.env.ASTRO_NODE_AUTOSTART = "disabled";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";

/**
 * Discover the ingress path from the Supervisor API.
 * Endpoint: GET /addons/self/info → { data: { ingress_url: "/api/hassio_ingress/<token>" } }
 * Falls back to undefined if Supervisor is unavailable (standalone mode).
 */
async function discoverIngressPath() {
  const token = process.env.SUPERVISOR_TOKEN;
  if (!token) {
    console.log("[serve] No SUPERVISOR_TOKEN — running in standalone mode (no ingress path injection)");
    return undefined;
  }

  try {
    const res = await fetch("http://supervisor/addons/self/info", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.warn(`[serve] Supervisor API returned ${res.status} — cannot discover ingress path`);
      return undefined;
    }

    const json = await res.json();
    const ingressUrl = json?.data?.ingress_url;
    if (ingressUrl && typeof ingressUrl === "string") {
      // ingress_url is like "/api/hassio_ingress/<token>" — strip trailing slash
      const path = ingressUrl.replace(/\/+$/, "");
      console.log(`[serve] Discovered ingress path: ${path}`);
      return path;
    }

    console.warn("[serve] Supervisor API response missing ingress_url:", JSON.stringify(json?.data));
    return undefined;
  } catch (err) {
    console.warn(`[serve] Failed to query Supervisor API: ${err.message}`);
    return undefined;
  }
}

// Discover the ingress path BEFORE starting the server
const discoveredIngressPath = await discoverIngressPath();

// Dynamically import the Astro entry to get the handler
const { handler } = await import("../dist/server/entry.mjs");

const server = http.createServer((req, res) => {
  // 1. Normalize URL: collapse duplicate slashes (// → /)
  if (req.url) {
    const [pathPart, ...queryParts] = req.url.split("?");
    const queryPart = queryParts.join("?");
    const normalized = pathPart.replace(/\/\/+/g, "/");
    req.url = queryPart ? `${normalized}?${queryPart}` : normalized;
  }

  // 2. Inject X-Ingress-Path if not already present
  //    This is the KEY fix: the HA Supervisor does NOT add this header,
  //    so the middleware never knows the ingress prefix, and all <a href="/">
  //    links point to the HA root instead of the addon.
  if (discoveredIngressPath && !req.headers["x-ingress-path"]) {
    req.headers["x-ingress-path"] = discoveredIngressPath;
  }

  handler(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Meitheal server listening on http://${HOST}:${PORT}`);
  if (discoveredIngressPath) {
    console.log(`[serve] Ingress path injected on all requests: ${discoveredIngressPath}`);
  }
});
