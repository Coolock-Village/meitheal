import { createLogger, defaultRedactionPatterns } from "@meitheal/domain-observability"

const logger = createLogger({
  service: "meitheal",
  env: process.env.NODE_ENV ?? "production",
  minLevel: (process.env.MEITHEAL_LOG_LEVEL as "debug" | "info" | "warn" | "error") ?? "info",
  enabledCategories: [],
  redactPatterns: defaultRedactionPatterns,
  auditEnabled: process.env.MEITHEAL_AUDIT_ENABLED === "true"
})

export interface CompatRequestLog {
  route: string
  method: string
  requestId: string
  status: number
  durationMs: number
  error?: string
}

export function logCompatRequest(entry: CompatRequestLog): void {
  const level = entry.status >= 500 ? "error" : entry.status >= 400 ? "warn" : "info"

  logger.log(level, {
    event: "compat.request.completed",
    domain: "integrations",
    component: "vikunja-compat",
    request_id: entry.requestId,
    duration_ms: entry.durationMs,
    message: `${entry.method} ${entry.route} → ${entry.status}`,
    ...(entry.error ? { err_code: entry.error } : {}),
    metadata: {
      route: entry.route,
      method: entry.method,
      status: entry.status
    }
  })
}

export function compatTimestamp(): number {
  return performance.now()
}
