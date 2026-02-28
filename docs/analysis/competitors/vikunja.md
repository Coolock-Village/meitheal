# Vikunja Competitor Analysis

## Snapshot
- Tool: Vikunja
- Analysis date: 2026-02-28
- Positioning: Self-hosted OSS task/project manager with list, kanban, gantt, table, API, and webhooks.

## Strengths
- Broad task views (list/kanban/gantt/table) with practical day-to-day workflow coverage.
- Mature self-hosting story with API and webhooks.
- Migration and ecosystem familiarity in the HA/homelab audience.

## Gaps vs Jira/Asana-Class Capability
- Limited evidence of first-class forms/intake workflows tied to rich custom-field logic.
- Filters/saved views have collaboration limits in practical usage.
- Plugin model is not yet equivalent to marketplace-level extension depth.
- Enterprise governance breadth (SSO/SCIM/compliance workflows) is not at SaaS enterprise parity.

## Relevance to Meitheal
- High protocol relevance because Meitheal already supports Vikunja-compatible `/api/v1` routes.
- High migration relevance for users coming from Vikunja + HA integrations.

## Implications for Meitheal
- Keep and expand protocol compatibility for migration and voice/automation clients.
- Exceed Vikunja in YAML-driven custom fields + framework logic (RICE/DRICE/HEART/KCS).
- Prioritize HA-native and Grocy/n8n/Node-RED integration ergonomics.
- Add richer intake/forms and conditional UI in Phase 5.

## Sources
- https://vikunja.io/features/
- https://vikunja.io/docs/filters/
- https://vikunja.io/docs/caldav/
- https://vikunja.io/docs/plugins/
- https://vikunja.io/docs/webhooks
