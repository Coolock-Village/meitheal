import type { MiddlewareHandler } from "astro";
import { getCollection } from "astro:content";
import {
  defaultIngressHeaders,
  getIngressPath,
  getMissingRequiredIngressHeaders,
  hasHassioToken,
  normalizeIngressHeaders,
  shouldEnforceIngressHeaders
} from "@domains/auth/ingress";

let cachedRequiredHeaders: string[] | null = null;

async function getRequiredIngressHeaders(): Promise<string[]> {
  if (cachedRequiredHeaders) {
    return cachedRequiredHeaders;
  }

  try {
    const configs = await getCollection("config");
    const authEntry = configs.find((entry: (typeof configs)[number]) => entry.id === "auth");
    const configured = authEntry?.data.auth?.ingress?.required_headers;

    if (Array.isArray(configured) && configured.length > 0) {
      cachedRequiredHeaders = normalizeIngressHeaders(configured);
      return cachedRequiredHeaders;
    }
  } catch {
    // Fallback to defaults for local dev or incomplete content config.
  }

  cachedRequiredHeaders = normalizeIngressHeaders([...defaultIngressHeaders]);
  return cachedRequiredHeaders;
}

export const onRequest: MiddlewareHandler = async ({ request, locals }, next) => {
  const requiredIngressHeaders = await getRequiredIngressHeaders();
  const ingressPath = getIngressPath(request.headers);

  locals.ingressPath = ingressPath;
  locals.hassioTokenPresent = hasHassioToken(request.headers);

  // For API routes that expect ingress context, fail fast if required headers are absent.
  if (shouldEnforceIngressHeaders(request.url, ingressPath)) {
    const missingHeaders = getMissingRequiredIngressHeaders(requiredIngressHeaders, request.headers);
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
