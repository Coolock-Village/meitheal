import type { MiddlewareHandler } from "astro";
import { getCollection } from "astro:content";

const defaultIngressHeaders = ["x-ingress-path", "hassio_token"];
let cachedRequiredHeaders: string[] | null = null;

function normalizeHeaders(headers: string[]): string[] {
  return [...new Set(headers.map((header) => header.trim().toLowerCase()).filter((header) => header.length > 0))];
}

async function getRequiredIngressHeaders(): Promise<string[]> {
  if (cachedRequiredHeaders) {
    return cachedRequiredHeaders;
  }

  try {
    const configs = await getCollection("config");
    const authEntry = configs.find((entry: (typeof configs)[number]) => entry.id === "auth");
    const configured = authEntry?.data.auth?.ingress?.required_headers;

    if (Array.isArray(configured) && configured.length > 0) {
      cachedRequiredHeaders = normalizeHeaders(configured);
      return cachedRequiredHeaders;
    }
  } catch {
    // Fallback to defaults for local dev or incomplete content config.
  }

  cachedRequiredHeaders = normalizeHeaders(defaultIngressHeaders);
  return cachedRequiredHeaders;
}

export const onRequest: MiddlewareHandler = async ({ request, locals }, next) => {
  const requiredIngressHeaders = await getRequiredIngressHeaders();
  const ingressPath = request.headers.get("x-ingress-path") ?? undefined;
  const hassioToken = request.headers.get("hassio_token") ?? request.headers.get("HASSIO_TOKEN");

  locals.ingressPath = ingressPath;
  locals.hassioTokenPresent = Boolean(hassioToken);

  // For API routes that expect ingress context, fail fast if required headers are absent.
  if (request.url.includes("/api/") && ingressPath) {
    const missingHeaders = requiredIngressHeaders.filter((header) => !request.headers.get(header));
    if (missingHeaders.length === 0) {
      return next();
    }

    return new Response(
      JSON.stringify({
        error: "Missing required ingress headers",
        missingHeaders
      }),
      {
      status: 401,
      headers: { "content-type": "application/json" }
      }
    );
  }

  return next();
};
