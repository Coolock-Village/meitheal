export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEvent {
  ts: string;
  level: LogLevel;
  event: string;
  domain: string;
  component: string;
  request_id: string;
  user_hash?: string;
  task_id?: string;
  integration?: string;
  duration_ms?: number;
  err_code?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface LoggerConfig {
  service: string;
  env: string;
  minLevel: LogLevel;
  enabledCategories: string[];
  redactPatterns: RegExp[];
  auditEnabled: boolean;
}

const severity: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return severity[level] >= severity[minLevel];
}

function redact(value: string, patterns: RegExp[]): string {
  let redacted = value;
  for (const pattern of patterns) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  return redacted;
}

export function createLogger(config: LoggerConfig) {
  return {
    log(level: LogLevel, partial: Omit<LogEvent, "ts" | "level">): void {
      if (!shouldLog(level, config.minLevel)) {
        return;
      }
      if (config.enabledCategories.length > 0 && !config.enabledCategories.includes(partial.domain)) {
        return;
      }

      const message = redact(partial.message, config.redactPatterns);
      const event: LogEvent = {
        ts: new Date().toISOString(),
        level,
        ...partial,
        message
      };

      // Keep output as a single JSON object per line for Loki parsing.
      process.stdout.write(`${JSON.stringify({ service: config.service, env: config.env, ...event })}\n`);
    },

    audit(partial: Omit<LogEvent, "ts" | "level">): void {
      if (!config.auditEnabled) {
        return;
      }
      this.log("info", { ...partial, domain: "audit" });
    }
  };
}

export const defaultRedactionPatterns: RegExp[] = [
  /(bearer\s+[a-z0-9\-._~+/]+=*)/gi,
  /(authorization:\s*[^\s]+)/gi,
  /(hassio_token=)[^&\s]+/gi,
  /(ha_token=)[^&\s]+/gi,
  /(supervisor_token=)[^&\s]+/gi,
  /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi
];
