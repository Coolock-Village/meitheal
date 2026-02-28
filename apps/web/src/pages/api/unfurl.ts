import type { APIRoute } from "astro";
import dns from "node:dns/promises";
import net from "node:net";
import { Agent } from "undici";

const blockedHosts = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function isPrivateHost(hostname: string): boolean {
  if (blockedHosts.has(hostname)) {
    return true;
  }

  return (
    hostname.endsWith(".local") ||
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
    return new Response(JSON.stringify({ error: "Missing url" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  if (!["http:", "https:"].includes(parsed.protocol) || isPrivateHost(parsed.hostname.toLowerCase())) {
    return new Response(JSON.stringify({ error: "Blocked URL target" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let dispatcher: Agent | undefined;

  try {
    const records = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
    if (records.length === 0 || records.some((record) => isPrivateIpAddress(record.address))) {
      return new Response(JSON.stringify({ error: "Blocked private network target" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
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
      return new Response(JSON.stringify({ error: "Redirects are not supported for unfurl targets" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return new Response(JSON.stringify({ error: "Unsupported content type" }), {
        status: 415,
        headers: { "content-type": "application/json" }
      });
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

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (err) {
    console.error("[unfurl] Failed to fetch URL:", url, err);
    return new Response(JSON.stringify({ error: "Unable to fetch URL" }), {
      status: 502,
      headers: { "content-type": "application/json" }
    });
  } finally {
    clearTimeout(timeout);
    if (dispatcher) {
      await dispatcher.close();
    }
  }
};
