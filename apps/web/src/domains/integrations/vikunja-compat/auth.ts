import { timingSafeEqual } from "node:crypto";

export interface CompatibilityAuthResult {
  ok: true;
  token: string;
}

const tokenSplitPattern = /[\s,]+/g;

/**
 * Load configured API tokens from environment variables.
 *
 * Supports two env vars:
 * - `MEITHEAL_VIKUNJA_API_TOKEN`: Single token string
 * - `MEITHEAL_VIKUNJA_API_TOKENS`: Multiple tokens, comma or whitespace separated
 *
 * Tokens are deduplicated and trimmed. At least one must be configured
 * for the Vikunja compatibility API to accept requests.
 */
function loadConfiguredTokens(): string[] {
  const single = process.env.MEITHEAL_VIKUNJA_API_TOKEN;
  const multi = process.env.MEITHEAL_VIKUNJA_API_TOKENS;

  const tokens = [
    ...(single ? [single] : []),
    ...(multi ? multi.split(tokenSplitPattern) : [])
  ]
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  return [...new Set(tokens)];
}

/** Module-level token cache to avoid re-parsing env on every request */
let cachedTokens: string[] | null = null;

function getConfiguredTokens(): string[] {
  if (cachedTokens === null) {
    cachedTokens = loadConfiguredTokens();
  }
  return cachedTokens;
}

/**
 * Constant-time token comparison to prevent timing side-channel attacks.
 * Compares two strings using Node.js timingSafeEqual after normalizing lengths.
 */
function timingSafeTokenMatch(supplied: string, configured: string): boolean {
  if (supplied.length !== configured.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(supplied, "utf-8"),
      Buffer.from(configured, "utf-8")
    );
  } catch {
    return false;
  }
}

export function authorizeCompatibilityRequest(request: Request): CompatibilityAuthResult | Response {
  const configuredTokens = getConfiguredTokens();
  if (configuredTokens.length === 0) {
    return new Response(
      JSON.stringify({
        error: "Compatibility API token is not configured",
        hint: "Set MEITHEAL_VIKUNJA_API_TOKEN or MEITHEAL_VIKUNJA_API_TOKENS"
      }),
      {
        status: 503,
        headers: { "content-type": "application/json" }
      }
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const supplied = match?.[1]?.trim();

  if (!supplied || !configuredTokens.some((t) => timingSafeTokenMatch(supplied, t))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "content-type": "application/json",
        "www-authenticate": 'Bearer realm="meitheal-vikunja-compat"'
      }
    });
  }

  return { ok: true, token: supplied };
}
