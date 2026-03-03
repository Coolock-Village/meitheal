export const defaultIngressHeaders = ["x-ingress-path"] as const;

export interface IngressContext {
  ingressPath: string | undefined;
  behindIngress: boolean;
}

const INGRESS_PREFIX_RE = /^\/api\/hassio_ingress\/[^/]+/i;

export function normalizeIngressHeaders(headers: string[]): string[] {
  return [...new Set(headers.map((header) => header.trim().toLowerCase()).filter((header) => header.length > 0))];
}

function normalizePathLikeValue(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return pathname || undefined;
  } catch {
    const pathname = trimmed.split("?")[0]?.split("#")[0]?.replace(/\/+$/, "");
    return pathname || undefined;
  }
}

function extractIngressPrefix(pathLikeValue: string | undefined | null): string | undefined {
  const normalized = normalizePathLikeValue(pathLikeValue);
  if (!normalized) return undefined;

  const match = normalized.match(INGRESS_PREFIX_RE);
  if (match) return match[0];
  return undefined;
}

export function resolveIngressContext(
  headers: Headers,
  supervisorTokenPresent: boolean,
  requestUrl?: string
): IngressContext {
  const explicitIngressPath = normalizePathLikeValue(
    headers.get("x-ingress-path") ?? headers.get("x-forwarded-prefix")
  );
  const inferredIngressPath = extractIngressPrefix(headers.get("x-forwarded-uri"))
    ?? extractIngressPrefix(headers.get("x-original-uri"))
    ?? extractIngressPrefix(requestUrl)
    ?? extractIngressPrefix(headers.get("referer"));
  const ingressPath = explicitIngressPath ?? inferredIngressPath;

  return {
    ingressPath,
    behindIngress: Boolean(ingressPath) || supervisorTokenPresent,
  };
}

export function getIngressPath(headers: Headers, requestUrl?: string): string | undefined {
  return resolveIngressContext(headers, false, requestUrl).ingressPath;
}

export function hasHassioToken(headers: Headers): boolean {
  return Boolean(headers.get("hassio_token"));
}

export function shouldEnforceIngressHeaders(url: string, ingressPath: string | undefined): boolean {
  try {
    const { pathname } = new URL(url);
    return (pathname === "/api" || pathname.startsWith("/api/")) && Boolean(ingressPath);
  } catch {
    // Fallback for non-parseable URLs
    return url.includes("/api/") && Boolean(ingressPath);
  }
}

export function getMissingRequiredIngressHeaders(requiredHeaders: string[], headers: Headers): string[] {
  return requiredHeaders.filter((header) => !headers.get(header));
}

/**
 * Extract the authenticated Home Assistant user ID from ingress headers.
 * The Supervisor injects `X-Hass-User-Id` on every proxied ingress request
 * after validating the user's session token.
 */
export function getHassUserId(headers: Headers): string | undefined {
  return headers.get("x-hass-user-id") ?? undefined;
}

/**
 * Check whether the authenticated HA user has admin privileges.
 * The Supervisor injects `X-Hass-Is-Admin` as "true" or "false".
 */
export function isHassAdmin(headers: Headers): boolean {
  return headers.get("x-hass-is-admin") === "true";
}
