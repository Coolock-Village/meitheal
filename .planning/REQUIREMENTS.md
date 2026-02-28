# Meitheal — Requirements

## Validated (Existing)

| ID | Requirement | Source | Tests |
|----|-------------|--------|-------|
| R-001 | Astro SSR with Node adapter for HA runtime | `STACK.md`, `README.md` | `pnpm check` |
| R-002 | DDD monorepo with 5 bounded contexts | `ARCHITECTURE.md`, `CONVENTIONS.md` | `governance/repo-standards.spec.ts` |
| R-003 | SQLite + Drizzle ORM with migration pipeline | `STACK.md`, `INTEGRATIONS.md` | `migration-check` CI job |
| R-004 | HA OS add-on with ingress auth | `INTEGRATIONS.md`, ops runbook | `ingress-header-validation.spec.ts` |
| R-005 | Vikunja-compat API (7 routes) | `INTEGRATIONS.md`, OA-401 | `vikunja-compat-auth.spec.ts`, live verifier |
| R-006 | Calendar sync via HA service | ADR-005, `INTEGRATIONS.md` | `ha-calendar-adapter.spec.ts`, `task-sync-persistence.spec.ts` |
| R-007 | Structured JSON logging + redaction | `CONVENTIONS.md`, ops runbook | `logger-redaction.spec.ts` |
| R-008 | Compat API observability | OA-402, OA-409 | `compat-logger.ts`, `compat-api.json` dashboard |
| R-009 | CI pipeline: 6 required jobs | `TESTING.md` | `ci.yml` |
| R-010 | Non-UTC timezone calendar handling | OA-410 | `vikunja-compat-calendar-timezone.spec.ts` |
| R-011 | HA custom component with structured errors | OA-411 | `__init__.py` |
| R-012 | Perf budgets (bundle/RSS/p95) | ops runbook | `perf-budgets` CI job |

## Active (Phase 2+)

| ID | Requirement | Phase | Priority | Source |
|----|-------------|-------|----------|--------|
| R-101 | HMAC-signed webhook emission for domain events | 2 | P0 | ADR-006 |
| R-102 | Webhook config schema (Zod + content YAML) | 2 | P0 | ADR-006 |
| R-103 | Grocy stock check adapter | 2 | P1 | ADR-006 |
| R-104 | n8n/Node-RED integration via webhook consumption | 2 | P1 | ADR-006 |
| R-105 | Integration webhook Grafana dashboard | 2 | P2 | ADR-006 |
| R-106 | SSRF hardening for `/api/unfurl` (DNS/IP deny list) | 2 | P1 | `CONCERNS.md` |
| R-107 | Rate limiting on compat API routes | 2 | P2 | `CONCERNS.md` |
| R-201 | Service worker + offline queue | 3 | P0 | README.md |
| R-202 | IndexedDB + background sync | 3 | P0 | README.md |
| R-203 | Deterministic conflict resolution | 3 | P1 | README.md |
| R-301 | Cloudflare Workers adapter + D1 | 4 | P0 | ADR-002 |
| R-401 | Passkeys / WebAuthn | 5 | P0 | README.md |
| R-402 | Rich link unfurl with caching | 5 | P1 | README.md |
| R-501 | Empty states for all dashboard/tasks views | 20 | P0 | `autonomous.md` |
| R-502 | Strict input sanitization & rate limiting headers | 20 | P0 | `autonomous.md` |
| R-503 | Advanced robust offline sync architecture | 20 | P1 | `autonomous.md` |
| R-504 | Global accessibility focus traps & contrast | 20 | P1 | `autonomous.md` |

## Out of Scope

| Exclusion | Reason |
|-----------|--------|
| Obsidian sync | Deferred to Phase 5+ |
| Calendar write-back from external events | Complexity, deferred |
| Full Grocy recipe management | Beyond integration scope |
| Electron/Tauri desktop app | Violates Astro-first principle |

---
*Last updated: 2026-02-28 after brownfield initialization*
