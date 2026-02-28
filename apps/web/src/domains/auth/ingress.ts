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
  return url.includes("/api/") && Boolean(ingressPath);
}

export function getMissingRequiredIngressHeaders(requiredHeaders: string[], headers: Headers): string[] {
  return requiredHeaders.filter((header) => !headers.get(header));
}
