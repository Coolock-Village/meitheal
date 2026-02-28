# Frontier Panel - Phase 1 Iteration 02

## Objective
Deliver a full HA-linked vertical slice with persistent storage, direct calendar integration, idempotency, and auditability while publishing the repository and enforcing branch governance.

| Persona | Recommendation | Impact (1-5) | Effort (1-5) | Risk (1-5) | Decision |
| --- | --- | --- | --- | --- | --- |
| Systems Architect | Move confirmation state from memory to SQLite-backed persistence with explicit sync states. | 5 | 3 | 4 | Accept |
| Integrations Architect | Use direct HA `calendar.create_event` service call with Supervisor token first and env fallback. | 5 | 3 | 4 | Accept |
| Reliability Engineer | Add idempotency-key replay behavior to avoid duplicate calendar calls. | 5 | 2 | 4 | Accept |
| Observability Engineer | Persist audit records and integration attempts keyed by request/task correlation IDs. | 5 | 2 | 4 | Accept |
| Ecosystem Architect | Incorporate HA custom component/HACS interoperability patterns from `joeShuff/vikunja-homeassistant`. | 4 | 2 | 2 | Accept |

## Rejections/Deferrals

- Full production passkey rollout: deferred to later iteration.
- Full plugin runtime marketplace: deferred.
