/**
 * Shared API response helpers for consistent JSON error/success responses.
 * KCS: every API endpoint should use these instead of inline Response constructors.
 */

/** Return a JSON error response with consistent shape. */
export function apiError(error: string, status: number = 500): Response {
    return new Response(JSON.stringify({ error }), {
        status,
        headers: { "content-type": "application/json" },
    });
}

/** Return a JSON success response. */
export function apiJson(data: unknown, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" },
    });
}
