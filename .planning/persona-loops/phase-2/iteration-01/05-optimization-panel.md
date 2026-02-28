# Optimization Panel — Phase 2 Iteration 01

## Panel Members

| Persona | Domain | Focus |
|---------|--------|-------|
| Integration Architect | Enterprise integration patterns | Event-driven architecture, idempotency, back-pressure |
| Performance Engineer | Node.js, SQLite, memory | Hot path analysis, connection pooling, memory budgets |
| DevOps Engineer | CI/CD, containers, HA add-ons | Build pipeline, image size, startup latency |
| Security Auditor | OWASP, supply chain | Dependency audit, secret rotation, header hardening |

## Findings

| ID | Persona | Finding | Impact | Effort | Risk | Score |
|----|---------|---------|--------|--------|------|-------|
| OF-201 | Integration Architect | Webhook emitter should support back-pressure on high event volume — if queue depth exceeds threshold, drop non-critical events (log + metric) instead of flooding downstream. | 4 | 3 | 3 | 10 |
| OF-202 | Performance Engineer | Token bucket rate limiter Map will grow unbounded if IPs never repeat. Add TTL-based eviction or LRU cache with max size. | 4 | 2 | 3 | 9 |
| OF-203 | Performance Engineer | Webhook delivery log table needs indexes on (status, created_at) for dead letter query and (subscriber_id, event_type) for dashboard queries. | 4 | 1 | 2 | 7 |
| OF-204 | DevOps Engineer | Migration 0004 should be tested in migration-splitter spec — add fixture for multi-statement migration with CREATE TABLE + CREATE INDEX. | 3 | 1 | 2 | 6 |
| OF-205 | Security Auditor | Webhook secret rotation strategy needed — document how to rotate per-subscriber secrets without delivery gaps (dual-secret verification window). | 3 | 2 | 4 | 9 |
| OF-206 | Security Auditor | Rate limiter bypass for health check endpoint — /api/health should not count against rate limit bucket. | 3 | 1 | 3 | 7 |
