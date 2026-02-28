# Frontier Panel - Phase 1 Iteration 04

## Objective

Execute pre-iteration-4 closure with compatibility API delivery, HA publishing readiness, reliability/security hardening, and CI-enforced drift/performance gates.

| Persona ID | Persona | Recommendation | Impact | Effort | Risk | Confidence | Decision | Mapped Task ID |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | Astro Core Architecture | Keep all new API work Astro-native in `apps/web` routes and content schemas. | 5 | 2 | 3 | 5 | Accept | T-401 |
| P02 | SSR/Runtime Adapter | Add health endpoint and startup diagnostics for add-on runtime verification. | 4 | 2 | 3 | 5 | Accept | T-407 |
| P03 | PWA/Offline Sync | Ensure compatibility routes do not bypass idempotent persistence flow. | 4 | 2 | 4 | 4 | Accept | T-402 |
| P04 | TypeScript API Design | Normalize compatibility route responses to deterministic JSON contracts. | 4 | 2 | 3 | 4 | Accept | T-401 |
| P05 | SQLite/Drizzle Modeling | Keep compatibility metadata in dedicated tables with indexes. | 4 | 3 | 3 | 4 | Accept | T-402 |
| P06 | Cloudflare Runtime | Keep compatibility domain isolated so Cloudflare adapter can consume later. | 3 | 2 | 2 | 3 | Accept | T-401 |
| P07 | WebAuthn Security | Expand ingress/auth threat-model checks in tests. | 4 | 3 | 4 | 4 | Accept | T-412 |
| P08 | AppSec SSRF/Injection | Keep unfurl DNS pinning + private-IP checks as mandatory gate. | 5 | 2 | 5 | 5 | Accept | T-412 |
| P09 | SRE Reliability | Enforce migration failure visibility and health probes at startup. | 5 | 2 | 4 | 5 | Accept | T-407 |
| P10 | Observability/Grafana-Alloy | Add log/audit coverage for compatibility API operations. | 4 | 2 | 3 | 4 | Accept | T-413 |
| P11 | CI/CD Engineering | Add schema drift and perf budget jobs as required checks. | 5 | 2 | 4 | 5 | Accept | T-408 |
| P12 | DDD Architecture | Keep compatibility protocol layer from leaking into domain abstractions. | 5 | 2 | 4 | 5 | Accept | T-402 |
| P13 | Integration Platform | Deliver exact endpoint subset used by voice assistant integration. | 5 | 3 | 4 | 5 | Accept | T-401 |
| P14 | API Compatibility | Validate payload/field parity for projects, labels, users, assignees. | 5 | 3 | 4 | 5 | Accept | T-401 |
| P15 | Migration/Data Safety | Harden SQL splitter and transaction handling in migration script. | 5 | 3 | 4 | 5 | Accept | T-406 |
| P16 | QA Automation | Add compatibility store and auth tests plus E2E compat flow gate. | 4 | 3 | 3 | 4 | Accept | T-414 |
| P17 | Performance Engineering | Enforce bundle/RSS/p95 budgets with fail-closed behavior. | 5 | 3 | 4 | 5 | Accept | T-409 |
| P18 | OSS Governance/License | Keep AGPL posture + dual-track adapter guidance in docs. | 3 | 2 | 2 | 4 | Accept | T-411 |
| P19 | Privacy Engineering | Keep env-only token auth for compatibility API, no YAML secrets. | 5 | 2 | 4 | 5 | Accept | T-403 |
| P20 | Failure-Mode Analysis | Ensure unknown task confirmations reject with 404/no orphan writes. | 5 | 2 | 5 | 5 | Accept | T-412 |
| P21 | ADHD Workflow UX | Keep one primary task-create path with explicit mode choices. | 4 | 2 | 2 | 4 | Accept | T-405 |
| P22 | Household Task UX | Preserve native Meitheal path as default over compat mode. | 4 | 2 | 2 | 4 | Accept | T-405 |
| P23 | Voice Interaction UX | Verify compat routes for voice assistant create/label/assignee flow. | 5 | 2 | 3 | 5 | Accept | T-401 |
| P24 | Mobile UX | Keep response payloads compact and predictable for voice followups. | 3 | 2 | 2 | 3 | Accept | T-401 |
| P25 | Information Architecture | Document native vs compat mode in README and component docs. | 4 | 1 | 2 | 5 | Accept | T-411 |
| P26 | Onboarding UX Writing | Add explicit setup docs for compatibility token and mode toggle. | 4 | 1 | 2 | 5 | Accept | T-411 |
| P27 | Error UX | Return clear 400/401/404/503 payloads for compat routes. | 4 | 2 | 3 | 4 | Accept | T-401 |
| P28 | Forms/Custom Fields UX | Preserve framework payload compatibility mapping metadata on tasks. | 3 | 2 | 2 | 3 | Accept | T-402 |
| P29 | Calendar UX | Gate compatibility calendar sync via explicit config mode. | 5 | 2 | 3 | 5 | Accept | T-404 |
| P30 | Automation UX | Keep webhook/audit signals for both native and compat operations. | 4 | 2 | 3 | 4 | Accept | T-413 |
| P31 | Accessibility Specialist | Keep compatibility changes API-side; no regressions in UI a11y suite. | 3 | 1 | 2 | 4 | Accept | T-414 |
| P32 | Motion/Interaction Design | No motion changes in this iteration; defer. | 1 | 1 | 1 | 5 | Defer | T-415 |
| P33 | Localization UX | Keep response keys stable for downstream localization in HA voice. | 3 | 1 | 2 | 4 | Accept | T-401 |
| P34 | Privacy/Consent UX | Ensure docs make token scope and storage model explicit. | 4 | 1 | 3 | 4 | Accept | T-411 |
| P35 | Community Contributor UX | Enforce required docs and publishing checklist in governance tests. | 4 | 2 | 2 | 5 | Accept | T-411 |
| P36 | HA Add-on Maintainer | Add-on config must include image contract and repository metadata. | 5 | 2 | 4 | 5 | Accept | T-411 |
| P37 | HACS Reviewer | Keep custom component scaffold docs + services metadata updated. | 4 | 2 | 2 | 4 | Accept | T-405 |
| P38 | HA Voice Pipeline | Validate compatibility endpoints needed by voice pipeline integration. | 5 | 3 | 4 | 5 | Accept | T-401 |
| P39 | HA Intent Specialist | Keep mode switch simple (`native`/`vikunja_compat`) in service schema. | 4 | 2 | 2 | 4 | Accept | T-405 |
| P40 | Supervisor/Ingress Specialist | Maintain supervisor token preference and ingress header enforcement. | 5 | 2 | 4 | 5 | Accept | T-412 |
| P41 | HA Green Resource Tuning | Prune build deps and enforce RSS budget in CI. | 5 | 2 | 4 | 5 | Accept | T-409 |
| P42 | Grocy Integrations | Keep integration extensibility contracts unchanged for Grocy plugin path. | 3 | 1 | 2 | 4 | Accept | T-402 |
| P43 | Node-RED Integrations | Preserve event/audit schema for external flow automation. | 4 | 2 | 3 | 4 | Accept | T-413 |
| P44 | n8n Integrations | Keep deterministic request IDs and idempotency metadata in outputs. | 4 | 2 | 3 | 4 | Accept | T-413 |
| P45 | Calendar Interop | Enforce compatibility calendar sync mode default `disabled`. | 5 | 2 | 3 | 5 | Accept | T-404 |
| P46 | Obsidian Integration | Keep compatibility payload metadata queryable for later export plugins. | 3 | 2 | 2 | 3 | Accept | T-402 |
| P47 | Grafana Dashboarding | Ensure compatibility events can be filtered by domain/component. | 4 | 2 | 3 | 4 | Accept | T-413 |
| P48 | Incident Runbook Ops | Add operations runbook sections for compat mode and perf/drift gates. | 4 | 1 | 3 | 5 | Accept | T-411 |
| P49 | Backup/Restore Ops | Keep schema evolutions migration-safe and explicit for backup restores. | 4 | 2 | 4 | 4 | Accept | T-406 |
| P50 | Security Compliance Review | Resolve all open security/reliability review threads before merge. | 5 | 2 | 5 | 5 | Accept | T-414 |
