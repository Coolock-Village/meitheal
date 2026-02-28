# GSD Plan and Tasks - Phase 1 Iteration 02

## Accepted Recommendations to Tasks

1. Publish and protect repository
- Source: ADHD Workflow Coach
- Task: create public `Coolock-Village/meitheal`, push bootstrap commit, enforce branch protection.

2. Persistent vertical slice
- Source: Systems Architect
- Task: implement SQLite-backed stores for `tasks`, `domain_events`, `integration_attempts`, `calendar_confirmations`, `audit_trail`.

3. HA direct calendar adapter
- Source: Integrations Architect
- Task: implement `CalendarIntegrationAdapter` with Home Assistant service calls and timeout/error classification.

4. Idempotent API orchestration
- Source: Reliability Engineer
- Task: update `/api/tasks/create` for request-id + idempotency key replay.

5. Persistent confirmation endpoint
- Source: Reliability Engineer
- Task: update `/api/integrations/calendar/confirmation` to idempotent persistence keyed by `taskId + confirmationId`.

6. Observability/audit hardening
- Source: Observability Engineer
- Task: persist audit records and extend log signals for task/integration lifecycle.

7. Ecosystem and review integration
- Source: Ecosystem Architect + Tooling Coach
- Task: add HACS/custom-component baseline files and CodeRabbit configuration.
