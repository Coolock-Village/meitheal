/**
 * Shared API error response helper — standardizes JSON error responses.
 * DRYs up the repeated pattern across all API endpoints.
 */
export function apiError(message: string, status: number = 400): Response {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "content-type": "application/json" },
    });
}

/**
 * Shared API JSON success response helper.
 */
export function apiJson(data: unknown, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" },
    });
}
