export interface CompatibilityAuthResult {
  ok: true;
  token: string;
}

const tokenSplitPattern = /[\s,]+/g;

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

export function authorizeCompatibilityRequest(request: Request): CompatibilityAuthResult | Response {
  const configuredTokens = loadConfiguredTokens();
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

  if (!supplied || !configuredTokens.includes(supplied)) {
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
