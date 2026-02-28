# Frontier Panel — Phase 2 Iteration 01

## Panel Members

| Persona | Domain | Focus |
|---------|--------|-------|
| Webhook Infrastructure Architect | Distributed event systems | Event delivery guarantees, signing, replay |
| HA Ecosystem Engineer | Home Assistant integrations | Add-on constraints, Supervisor API, ingress |
| API Security Engineer | OWASP, SSRF, rate limiting | Attack surface reduction, defense-in-depth |
| Observability SRE | Loki/Grafana/Alloy pipelines | Dashboard design, log cardinality, alerting |

## Recommendations

| ID | Persona | Recommendation | Impact | Effort | Risk | Score |
|----|---------|----------------|--------|--------|------|-------|
| FR-201 | Webhook Architect | Add webhook delivery idempotency via `X-Meitheal-Delivery-Id` (UUID) — consumers can deduplicate on this. Already in Plan 01 T-203 headers but enforce uniqueness in DB. | 5 | 2 | 2 | 9 |
| FR-202 | Webhook Architect | Add webhook config validation on startup — fail fast if subscribers have invalid URLs or missing secrets. Don't wait for first event. | 4 | 1 | 3 | 8 |
| FR-203 | HA Ecosystem Engineer | Verify Grocy adapter works within HA add-on network namespace. Grocy may be on a different Docker network — document required HA network config. | 4 | 2 | 4 | 10 |
| FR-204 | API Security Engineer | Rate limiter should use `X-Forwarded-For` behind HA ingress proxy, not raw socket IP. HA ingress always proxies — raw IP would be 127.0.0.1. | 5 | 1 | 5 | 11 |
| FR-205 | API Security Engineer | Add Content-Security-Policy headers on webhook dead letter replay endpoint to prevent stored XSS if payloads contain HTML. | 3 | 1 | 4 | 8 |
| FR-206 | Observability SRE | Webhook dashboard should include subscriber-level health (per-subscriber success rate) not just aggregate — enables per-consumer debugging. | 4 | 2 | 2 | 8 |
| FR-207 | Observability SRE | Add alerting rule for dead letter queue depth > 10 — indicates systemic delivery failure. Ship as Grafana alert JSON. | 3 | 2 | 3 | 8 |
| FR-208 | Webhook Architect | Dead letter replay endpoint should require admin auth (ingress header validation) and emit audit trail events. | 4 | 2 | 4 | 10 |
