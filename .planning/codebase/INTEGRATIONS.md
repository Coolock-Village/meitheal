# External Integrations

**Analysis Date:** 2026-02-28

## APIs & External Services

**Home Assistant:**
- Primary integration target — task-to-calendar sync
- SDK/Client: Custom `HomeAssistantCalendarAdapter` in `packages/integration-core/src/home-assistant-calendar.ts`
- Auth: `SUPERVISOR_TOKEN` (preferred, auto-detected in add-on) or `HA_BASE_URL` + `HA_TOKEN`
- Endpoint: `POST /api/services/calendar/create_event`
- Timeout: 8 seconds default, retryable on 429/5xx

**Vikunja Compatibility:**
- Protocol-level compatibility for voice assistant integrations
- SDK/Client: Custom HTTP handlers in `apps/web/src/domains/integrations/vikunja-compat/`
- Auth: `MEITHEAL_VIKUNJA_API_TOKEN` or `MEITHEAL_VIKUNJA_API_TOKENS` (comma-separated)
- Surface: 7 REST endpoints under `/api/v1/` (projects, tasks, labels, users, assignees)

## Data Storage

**Databases:**
- SQLite via libSQL (`@libsql/client`)
  - Connection: `MEITHEAL_DB_URL` (default: `file:/data/meitheal.db`)
  - Client: Drizzle ORM (`drizzle-orm`)
  - Tables: `tasks`, `domain_events`, `integration_attempts`, `calendar_confirmations`, `audit_trail`
  - Migrations: `apps/web/drizzle/migrations/`

**File Storage:**
- Local filesystem only (SQLite database file)

**Caching:**
- None — middleware caches required ingress headers in memory

## Authentication & Identity

**Auth Provider:**
- HA Ingress (native) — header-based trust bridge
  - Implementation: `apps/web/src/domains/auth/ingress.ts`
  - Required headers: `x-ingress-path`, configurable via content schema
  - HASSIO token detection for supervisor context
- Vikunja compat tokens (env-only) — bearer token validation
  - Implementation: `apps/web/src/domains/integrations/vikunja-compat/auth.ts`

## Monitoring & Observability

**Error Tracking:**
- Structured JSON logs with `err_code` field
- No external error tracking service (Sentry, etc.)

**Logs:**
- Structured JSON to stdout → HA journal → Alloy → Loki → Grafana
- Config: `addons/meitheal-hub/rootfs/etc/alloy/config.river`
- Redaction: Default patterns for bearer tokens, emails, HA tokens

## CI/CD & Deployment

**Hosting:**
- Home Assistant OS (add-on) — primary
- Cloudflare Workers (adapter skeleton) — future

**CI Pipeline:**
- GitHub Actions — 4 workflows:
  - `ci.yml` — 6 required jobs (governance, typecheck-and-tests, ha-harness, migration-check, schema-drift, perf-budgets)
  - `publish-addon-images.yml` — Multi-arch Docker build (tag-triggered)
  - `live-ha-integration.yml` — Live HA calendar test (manual)
  - `live-vikunja-voice-assistant.yml` — Live compat validation (manual)

**PR Review:**
- CodeRabbitAI enabled (`.coderabbit.yaml`)
- Protected `main` branch with required checks

## Environment Configuration

**Required env vars:**
- `MEITHEAL_DB_URL` — Database path
- `SUPERVISOR_TOKEN` or `HA_BASE_URL` + `HA_TOKEN` — HA auth

**Optional env vars:**
- `MEITHEAL_VIKUNJA_API_TOKEN` / `MEITHEAL_VIKUNJA_API_TOKENS` — Compat auth
- `MEITHEAL_LOG_LEVEL`, `MEITHEAL_LOG_REDACTION`, `MEITHEAL_AUDIT_ENABLED` — Logging
- `LOKI_URL` — Observability pipeline
- `MEITHEAL_COMPAT_CALENDAR_SYNC_MODE` — Compat calendar override
- `MEITHEAL_PERF_BUDGET_*` — Performance threshold overrides

**Secrets location:**
- Environment variables only (never YAML-stored)
- HA add-on options expose log/audit toggles (not secrets)

## Webhooks & Callbacks

**Incoming:**
- `/api/integrations/calendar/confirmation` — Calendar sync confirmation endpoint

**Outgoing:**
- HA calendar service calls (`POST /api/services/calendar/create_event`)

---

*Integration audit: 2026-02-28*
