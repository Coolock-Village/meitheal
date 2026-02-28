# Phase 2: Integration Deepening — Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers **outbound integration infrastructure** — the ability for Meitheal domain events (task.created, framework.score.applied, integration.sync.*) to trigger actions in external systems via webhooks, and for Meitheal to query external systems (Grocy) for data enrichment on task creation.

This phase does NOT add new task types, UI features, or authentication changes. It extends the existing domain event model with outbound emission and adds one read-only external adapter.

</domain>

<decisions>
## Implementation Decisions

### Webhook Architecture
- HMAC-SHA256 signing on all outbound webhooks using per-subscriber secrets
- `X-Meitheal-Signature` header for verification (consistent with industry standard)
- Retry with exponential backoff (3 attempts, 1s/4s/16s) — matches HA calendar adapter pattern
- Dead letter queue: failed webhooks stored in SQLite for manual replay
- Config in `integrations.yaml` content schema (Zod-validated), not DB-stored — immutable per deploy, consistent with existing config-externalization principle

### Event Surface
- All existing domain events eligible for webhook emission: `task.created`, `task.updated`, `framework.score.applied`, `integration.sync.requested`, `integration.sync.completed`
- New event: `webhook.delivery.failed` (for observability pipeline, not re-emitted as webhook)
- Event payload follows existing `DomainEvent<T>` envelope — no new schema

### Grocy Adapter
- Read-only adapter: `checkStock(ingredients: string[])` and `consumeItems(items: ConsumeRequest[])`
- Config: `MEITHEAL_GROCY_URL` + `MEITHEAL_GROCY_API_KEY` environment variables
- Follows `CalendarIntegrationAdapter` pattern from `integration-core/`
- Triggered optionally on task create when task has grocery-related framework fields
- Timeout/retry semantics match HA adapter (8s timeout, classifyError for retry)

### n8n / Node-RED Integration
- Pure webhook consumers — no dedicated Meitheal adapter needed
- Documented example flows in KCS docs (n8n receives `task.created` → checks Grocy → creates shopping list)
- No Meitheal-side code beyond webhook emission

### Security Hardening
- SSRF for `/api/unfurl`: add DNS resolution check (deny private IPs), content-type allowlist, size cap (1MB), timeout (5s)
- Rate limiting on compat API: token bucket per IP, 100 req/min default, configurable via env
- Webhook target URLs: no private IPs allowed (same SSRF guardrail reused)

### Observability
- Webhook delivery dashboard panel in existing Grafana JSON
- Structured logging for webhook emission via `domain-observability` logger
- New Loki labels: none (stay low-cardinality) — webhook target in JSON body only

### Claude's Discretion
- Webhook retry backoff curve specifics
- Grocy adapter error message formatting
- KCS doc structure for webhook setup guide
- Dashboard panel layout/ordering

</decisions>

<specifics>
## Specific Ideas

- Webhook emission should reuse the existing `DomainEvent<T>` envelope — no wrapper transformation
- Grocy adapter should feel identical to the HA calendar adapter from a code structure perspective (same module layout in `integration-core/`)
- Rate limiter should be middleware-level, not per-route — consistent with ingress auth pattern
- Dead letter queue should be queryable via a new API route for operational visibility

</specifics>

<deferred>
## Deferred Ideas

- Obsidian vault sync — Phase 5 scope
- Bidirectional Grocy sync (write-back) — beyond read-only adapter scope
- Webhook subscription management UI — Phase 5 (market parity)
- Real-time WebSocket push for webhook status — future consideration

</deferred>

---

*Phase: 02-integration-deepening*
*Context gathered: 2026-02-28*
