# GSD Plan and Tasks — Phase 2 Iteration 01

## Accepted Recommendations to Tasks

1. **Webhook delivery idempotency (FR-201)**
   - Source: Frontier Panel / Webhook Architect
   - Task: Enforce unique `X-Meitheal-Delivery-Id` in webhook_deliveries DB table. Add unique constraint on delivery_id.

2. **Webhook config startup validation (FR-202)**
   - Source: Frontier Panel / Webhook Architect
   - Task: Add config validation in webhook-dispatch.ts startup — fail fast on invalid URLs/missing secrets.

3. **HA network namespace documentation (FR-203)**
   - Source: Frontier Panel / HA Ecosystem Engineer
   - Task: Document Grocy network requirements in webhook-setup-guide.md — Docker network configuration for cross-add-on communication.

4. **Rate limiter X-Forwarded-For (FR-204)**
   - Source: Frontier Panel / API Security Engineer
   - Task: Use `X-Forwarded-For` header (first untrusted IP) for rate limiting behind HA ingress proxy. Fall back to socket IP for direct access.
   - **Critical:** Without this fix, all HA ingress requests rate-limit as 127.0.0.1.

5. **Dead letter replay auth + audit (FR-208)**
   - Source: Frontier Panel / Webhook Architect
   - Task: Dead letter replay endpoint requires ingress auth header validation. Emit audit trail event on replay.

6. **Subscriber-level dashboard (FR-206)**
   - Source: Frontier Panel / Observability SRE
   - Task: Add per-subscriber success rate panel to webhook dashboard.

7. **Parallel Wave 1 execution (AD-201)**
   - Source: ADHD Panel / Focus Optimizer
   - Task: Execute Plans 01 and 02 in parallel — no dependency between them.

8. **TDD-first signer and emitter (AD-204)**
   - Source: ADHD Panel / Execution Coach
   - Task: Write T-206 tests before T-202/T-203 implementation.

9. **Webhook CI test (AD-206)**
   - Source: ADHD Panel / Automation Specialist
   - Task: Add webhook delivery round-trip test to CI pipeline.

## Deferred

- FR-205 (CSP on dead letter replay) — low risk, defer to optimization pass
- FR-207 (dead letter alerting rule) — defer to optimization, not blocking
- AD-203 (YAML event catalog) — nice-to-have, defer
- AD-207 (Grocy in ha-harness CI) — requires Grocy test instance, defer
