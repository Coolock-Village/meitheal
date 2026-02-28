# Iteration 05 — Integrations RFC

**Status:** Draft
**Author:** Antigravity (AI agent, on behalf of Ryan Winkler)
**Date:** 2026-02-28

## Summary

Iteration 05 focuses on deepening the integration surface beyond Home Assistant calendar sync. The target integrations are Grocy, Node-RED, and n8n — enabling Meitheal to act as the central task orchestrator for a homelab automation stack.

## Motivation

Meitheal's current integration surface is HA-calendar-only. Users of homelab automation stacks expect:

1. **Grocy** — ingredient/inventory checks triggered by meal-planning tasks
2. **Node-RED / n8n** — event-driven automation flows triggered by Meitheal domain events
3. **Webhook emission** — generic outbound events for any subscriber

These integrations follow the existing `integration-core` adapter pattern — each implements a common interface, is config-gated, and emits structured log events.

## Proposed Architecture

### Webhook Emission (Foundation)

All domain events (`task.created`, `task.updated`, `framework.score.applied`, `integration.sync.*`) should optionally emit to configured webhook URLs.

```yaml
# integrations.yaml
webhooks:
  - url: https://n8n.local/webhook/meitheal-events
    events: ["task.created", "task.updated"]
    secret: ${MEITHEAL_WEBHOOK_SECRET_1}
  - url: https://nodered.local/meitheal
    events: ["*"]
    secret: ${MEITHEAL_WEBHOOK_SECRET_2}
```

**Implementation:**
- New `packages/integration-core/src/webhook-emitter.ts`
- HMAC-SHA256 signature in `X-Meitheal-Signature` header
- Timeout + retry with exponential backoff
- Config loaded from `integrations.yaml` content schema

### Grocy Adapter

**Scope:** Read inventory, trigger stock checks on task creation (e.g., "Cook Dinner" → check Grocy for missing ingredients).

**Interface:**
```typescript
interface GrocyAdapter {
  checkStock(ingredients: string[]): Promise<StockCheckResult>
  consumeItems(items: ConsumeRequest[]): Promise<void>
}
```

**Config:** `MEITHEAL_GROCY_URL` + `MEITHEAL_GROCY_API_KEY`

### Node-RED / n8n Integration

These are pure webhook consumers — no dedicated adapter needed. The webhook emission layer handles both.

**n8n flow example:**
1. Meitheal emits `task.created` webhook
2. n8n receives, checks Grocy stock via its own Grocy node
3. n8n creates a shopping list item if stock is low

## Implementation Plan

| Task | Package | Priority |
|------|---------|----------|
| Webhook emitter with HMAC signing | `integration-core` | P0 |
| Webhook config schema (Zod + content) | `apps/web` | P0 |
| Grocy adapter skeleton | `integration-core` | P1 |
| Grocy stock check on task create | `domain-tasks` | P1 |
| Webhook E2E test | `tests/e2e` | P0 |
| Grocy integration test | `tests/e2e` | P1 |
| KCS runbook for webhook setup | `docs/kcs` | P1 |
| Dashboard panel for webhook outcomes | `addons/meitheal-hub` | P2 |

## Non-Goals (Iteration 05)

- Obsidian sync (deferred to iteration 06+)
- Calendar write-back from external events (deferred)
- Full Grocy recipe management (out of scope)

## Open Questions

1. Should webhook config live in `integrations.yaml` or be DB-stored for runtime updates?
2. Should Grocy adapter be a separate package or part of `integration-core`?
3. Rate limiting strategy for webhook emission under high task creation load?

---

*This RFC will be refined during `/gsd:discuss-phase` for iteration 05.*
