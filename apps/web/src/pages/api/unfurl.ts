import type { APIRoute } from "astro";
import dns from "node:dns/promises";
import net from "node:net";
import { Agent } from "undici";
import { apiError, apiJson } from "../../lib/api-response";
import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability";

const logger = createLogger({
  service: "meitheal-web",
  env: process.env.NODE_ENV ?? "development",
  minLevel: "info",
  enabledCategories: ["tasks", "audit", "observability"],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: true,
});

const blockedHosts = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

/**
 * HA-aware private host detection.
 * `.local` (mDNS) and `.home.arpa` (HA default domain) are ALLOWED
 * because they are legitimate HA network targets.
 * Only block actual dangerous loopback/metadata/link-local addresses.
 */
function isPrivateHost(hostname: string): boolean {
  if (blockedHosts.has(hostname)) {
    return true;
  }

  // Allow .local (mDNS) and .home.arpa (HA default) — these are valid HA network targets
  if (hostname.endsWith(".local") || hostname.endsWith(".home.arpa")) {
    return false;
  }

  return (
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function isPrivateIpAddress(ip: string): boolean {
  if (net.isIP(ip) === 4) {
    return (
      ip.startsWith("10.") ||
      ip.startsWith("127.") ||
      ip.startsWith("169.254.") ||
      ip.startsWith("0.") ||
      ip.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
    );
  }

  if (net.isIP(ip) === 6) {
    const lowered = ip.toLowerCase();
    if (lowered.startsWith("::ffff:")) {
      const mappedIp = lowered.slice("::ffff:".length);
      if (net.isIP(mappedIp) === 4) {
        return isPrivateIpAddress(mappedIp);
      }
    }
    return lowered === "::1" || lowered.startsWith("fc") || lowered.startsWith("fd") || lowered.startsWith("fe80");
  }

  return false;
}

function extractMeta(html: string, property: string): string | undefined {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  const match = html.match(pattern);
  return match?.[1];
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match?.[1]?.trim();
}

export const POST: APIRoute = async ({ request }) => {
  const { url } = (await request.json().catch(() => ({}))) as { url?: string };
  if (!url) {
    return apiError("Missing url", 400);
  }
  if (url.length > 2048) {
    return apiError("URL exceeds maximum length of 2048 characters", 400);
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return apiError("Invalid URL", 400);
  }

  if (!["http:", "https:"].includes(parsed.protocol) || isPrivateHost(parsed.hostname.toLowerCase())) {
    return apiError("Blocked URL target", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let dispatcher: Agent | undefined;

  try {
    const records = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
    if (records.length === 0 || records.some((record) => isPrivateIpAddress(record.address))) {
      return apiError("Blocked private network target", 400);
    }

    const pinnedRecords = records.map((record) => ({
      address: record.address,
      family: record.family
    }));
    dispatcher = new Agent({
      connect: {
        // Pin DNS results for fetch to avoid re-resolution and DNS rebinding.
        lookup: ((hostname: string, options: unknown, callback: (...args: unknown[]) => void) => {
          if (hostname.toLowerCase() !== parsed.hostname.toLowerCase()) {
            callback(new Error("Blocked redirected or re-resolved host"));
            return;
          }

          const normalizedOptions =
            typeof options === "number" ? { family: options, all: false } : ((options ?? {}) as { family?: number; all?: boolean });
          if (normalizedOptions.all) {
            callback(null, pinnedRecords);
            return;
          }

          const selected =
            (typeof normalizedOptions.family === "number"
              ? pinnedRecords.find((record) => record.family === normalizedOptions.family)
              : undefined) ?? pinnedRecords[0];
          if (!selected) {
            callback(new Error("No pinned DNS records available"));
            return;
          }
          callback(null, selected.address, selected.family);
        }) as any
      }
    });

    const response = await fetch(parsed, {
      signal: controller.signal,
      dispatcher,
      redirect: "manual",
      headers: {
        "user-agent": "meitheal-unfurl/0.1",
        host: parsed.host
      }
    } as RequestInit & { dispatcher: Agent });

    if (response.status >= 300 && response.status < 400) {
      return apiError("Redirects are not supported for unfurl targets", 400);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return apiError("Unsupported content type", 415);
    }

    const html = await response.text();
    const payload = {
      url: parsed.toString(),
      title: extractMeta(html, "og:title") ?? extractTitle(html),
      description: extractMeta(html, "og:description") ?? extractMeta(html, "description"),
      image: extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image"),
      siteName: extractMeta(html, "og:site_name"),
      fetchedAt: new Date().toISOString()
    };

    return apiJson(payload);
  } catch (err) {
    logger.log("error", {
      event: "api.unfurl.post.failed",
      domain: "tasks",
      component: "unfurl-api",
      request_id: crypto.randomUUID(),
      message: "Internal server error",
    });
    return apiError("Unable to fetch URL", 502);
  } finally {
    clearTimeout(timeout);
    if (dispatcher) {
      await dispatcher.close();
    }
  }
};
