export const defaultIngressHeaders = ["x-ingress-path", "hassio_token"] as const;

export function normalizeIngressHeaders(headers: string[]): string[] {
  return [...new Set(headers.map((header) => header.trim().toLowerCase()).filter((header) => header.length > 0))];
}

export function getIngressPath(headers: Headers): string | undefined {
  return headers.get("x-ingress-path") ?? undefined;
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
