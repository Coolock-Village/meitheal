/**
 * Structured Error Codes — API Error Response Standard
 *
 * Canonical error codes for all API responses.
 * Clients can match on `code` field for programmatic error handling.
 *
 * Bounded context: lib (shared utility)
 *
 * @domain api
 */

/** Canonical API error codes */
export const ErrorCodes = {
  // --- Validation (400) ---
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_UUID: "INVALID_UUID",
  INVALID_STATUS: "INVALID_STATUS",
  MISSING_FIELD: "MISSING_FIELD",

  // --- Authentication (401/403) ---
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // --- Not Found (404) ---
  NOT_FOUND: "NOT_FOUND",
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
  BOARD_NOT_FOUND: "BOARD_NOT_FOUND",

  // --- Conflict (409) ---
  CONFLICT: "CONFLICT",
  DUPLICATE_TASK: "DUPLICATE_TASK",
  IDEMPOTENCY_CONFLICT: "IDEMPOTENCY_CONFLICT",

  // --- Rate Limiting (429) ---
  RATE_LIMITED: "RATE_LIMITED",

  // --- Server (500) ---
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  HA_CONNECTION_ERROR: "HA_CONNECTION_ERROR",
  SYNC_ERROR: "SYNC_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Build a structured API error response.
 * Consumers can match on `code` for programmatic handling.
 */
export function structuredError(
  code: ErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>,
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      code,
      ...(details ? { details } : {}),
    }),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );
}
