# OSS PM Gap Matrix (Meitheal Reference)

## Scope
- Analysis date: 2026-02-28
- Goal: map competitive capability coverage against Meitheal target architecture and roadmap.
- Sources: official product docs/repos referenced in `docs/analysis/competitors/*.md`.

## Capability Matrix

Legend: `Strong`, `Partial`, `Weak/Not Primary`

| Capability | Vikunja | Super Productivity | OpenProject CE | Plane CE | Taiga | Wekan | Leantime OSS | Redmine | AppFlowy | Focalboard | Meitheal Target |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Task views (list/kanban/table/gantt) | Strong | Partial | Strong | Strong | Strong | Partial | Partial | Strong | Partial | Partial | Strong |
| Local-first/offline execution | Partial | Strong | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Strong | Weak/Not Primary | Strong |
| Rich custom fields + forms logic | Partial | Partial | Strong | Partial | Partial | Partial | Partial | Strong | Partial | Weak/Not Primary | Strong |
| Portfolio/workload/capacity planning | Partial | Weak/Not Primary | Partial | Partial | Partial | Weak/Not Primary | Partial | Partial | Weak/Not Primary | Weak/Not Primary | Strong |
| No-code automation depth | Partial | Partial | Partial | Partial | Partial | Partial | Partial | Partial | Weak/Not Primary | Weak/Not Primary | Strong |
| API/webhooks ecosystem | Strong | Partial | Strong | Strong | Strong | Partial | Partial | Strong | Partial | Partial | Strong |
| Enterprise governance (SSO/SCIM/compliance) | Weak/Not Primary | Weak/Not Primary | Partial | Partial | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Partial | Weak/Not Primary | Weak/Not Primary | Partial (phased) |
| Mobile/offline/collab parity | Partial | Partial | Partial | Partial | Partial | Partial | Partial | Partial | Partial | Partial | Strong (target) |
| HA/Grocy-native integration | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Weak/Not Primary | Strong |

## Structural Gaps Across OSS (Cross-Tool)

1. No single OSS tool consistently combines portfolio/workload/dependency scenario planning with low-friction UX.
2. Mature no-code forms + rich field logic + automation in one package is still uncommon.
3. Integration ecosystems are narrower than Atlassian/Asana marketplace depth.
4. Enterprise governance parity (SSO/SCIM/audit/compliance) in pure OSS tiers is inconsistent.
5. Consistent mobile/offline/collaboration parity remains uneven.

## Meitheal Priority Gap Shortlist

1. Portfolio/workload + strategy scoring integration
- Why: largest OSS coverage gap and key differentiator for Meitheal.
- Planned fit: Phase 5 (`Market Parity`) plus strategy domain expansion.

2. Forms + custom-field logic + conditional UI
- Why: repeatedly weak/partial across OSS tools.
- Planned fit: Phase 3 (local-first UX surfaces) + Phase 5 parity features.

3. HA-first integration fabric (Grocy, n8n, Node-RED)
- Why: strongest Meitheal-specific moat; mostly absent in peers.
- Planned fit: Phase 2 (`Integration Deepening`).

4. Offline-first and ultra-light runtime profile
- Why: combines Super Productivity strengths with HA-native control plane.
- Planned fit: Phase 3 + performance budget governance.

5. Governance and observability by default
- Why: reduces ops/security risk at self-host scale.
- Planned fit: ongoing across phases with ADR/KCS/CI gates.

## Traceability

- Project requirements: `.planning/PROJECT.md`
- Roadmap phases: `.planning/ROADMAP.md`
- Architecture baseline: `docs/decisions/0002-target-architecture.md`
- Phase 2 context and plans: `.planning/phases/02-integration-deepening/`
