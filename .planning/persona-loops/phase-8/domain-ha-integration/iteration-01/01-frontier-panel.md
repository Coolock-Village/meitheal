# Frontier Expert Panel — Phase 8 HA Integration Domain

## Objective

Audit the Home Assistant integration domain for completeness, correctness, and first-class support.

| Persona | Recommendation | Impact | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Platform Architect | Test Connection was testing our own `/api/health`, not actual HA connection. Create `/api/ha/connection` that tests `http://supervisor/core/api/config` via `SUPERVISOR_TOKEN`. | 5 | 2 | 1 | ✅ Done |
| Platform Architect | Settings Test Connection shows HA version, timezone, location, available components (calendar, todo, automation, script, webhook). | 4 | 1 | 1 | ✅ Done |
| Reliability Engineer | HA connection test has 5s timeout, AbortController, proper error messages for all failure modes. | 4 | 1 | 1 | ✅ Done |
| OSS Integrations | Config.yaml already has `homeassistant_api: true`, `hassio_api: true`, `ingress: true` — correct for HA add-on. | 0 | 0 | 0 | Already correct |
| OSS Integrations | `SUPERVISOR_TOKEN` flow is sound — proper fallback chain in `runtime.ts` and `home-assistant-calendar.ts`. | 0 | 0 | 0 | Already correct |
| Platform Architect | Add WebSocket connection for real-time entity state updates (live dashboard). | 4 | 4 | 2 | Defer → Phase 9 |
| Security Engineer | Ingress auth middleware correctly checks `hassio_token` and `x-ingress-path` headers. | 0 | 0 | 0 | Already correct |
