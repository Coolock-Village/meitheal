# Parity Specification (Vikunja + Super Productivity Baseline)

## Scope
- Analysis date: 2026-02-28
- Objective: define what Meitheal must meet and must exceed.
- Applies to roadmap Phases 2-5 and associated implementation plans.

## Must Meet (Parity Floor)

### Vikunja-Comparable Baseline
1. API compatibility for critical task/project/label/user flows.
2. Core task management views and workflow primitives.
3. Webhook-ready event integration surface.
4. Self-host operational viability with documented deployment/runbooks.

### Super Productivity-Comparable Baseline
1. Fast personal execution workflows (minimal interaction cost).
2. Local-first responsiveness and robust offline behavior.
3. Time-oriented work ergonomics and low cognitive load.
4. Strong privacy posture for self-host and personal usage.

## Must Exceed (Meitheal Differentiators)

1. Home Assistant-native runtime and ingress integration.
2. Grocy + n8n + Node-RED first-class integration patterns.
3. YAML/MD/MDX-driven frameworks and settings for customization.
4. DDD + KCS + ADR governance discipline across code/docs/tests.
5. HA Green resource profile with strict CI performance budgets.
6. Coordinated observability pipeline for HA/Grafana/Alloy/Loki.

## Non-Negotiable Architectural Constraints

1. Astro-first/native delivery; prefer official Astro OSS integrations where suitable.
2. HA-first and Cloudflare-capable dual runtime topology.
3. Domain boundaries must remain explicit and infrastructure-agnostic.
4. Env-only secret handling; no token leakage into config/client payloads.
5. Feature additions must include tests + KCS documentation updates in same change set.

## Testable Acceptance Criteria

1. Compatibility and Migration
- `/api/v1` compatibility routes pass protocol tests and live verifier workflow.
- Unknown/invalid compatibility requests return deterministic error contracts.

2. Integration Fabric
- Domain events can emit signed webhooks with replay-safe delivery IDs.
- Grocy adapter path can execute stock-check workflow under HA deployment constraints.
- n8n/Node-RED integration is documented and test-covered via webhook contracts.

3. Local-First UX
- Offline queue + deterministic conflict handling are covered by automated tests.
- PWA behavior is measurable and budgeted in CI.

4. Security and Governance
- SSRF controls enforced for external URL fetch paths.
- Rate limiting enforced for compatibility and public-facing API surfaces.
- Required governance files and docs stay green in CI.

5. Performance
- CI-enforced client bundle, RSS, and p95 latency budgets remain within thresholds.
- HA Green runtime assumptions are continuously validated via budget checks.

## Traceability Links

- Competitive baseline: `docs/analysis/gap-matrix.md`
- Competitor details: `docs/analysis/competitors/*.md`
- Project scope: `.planning/PROJECT.md`
- Delivery sequencing: `.planning/ROADMAP.md`
- Phase implementation context: `.planning/phases/02-integration-deepening/02-CONTEXT.md`
