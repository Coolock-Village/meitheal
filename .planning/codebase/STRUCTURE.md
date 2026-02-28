# Codebase Structure

**Analysis Date:** 2026-02-28
**Commit:** 9b9f2ab

## Directory Layout

```
meitheal/
├── .agents/rules/           # Agent behavior rules (autonomous.md)
├── .github/workflows/       # CI/CD (ci.yml, publish-addon, live-ha, live-vikunja)
├── .planning/               # GSD planning (codebase map, persona loops)
├── .skills/                 # Agent skill definitions
├── .zeroclaw/               # AI soul file
├── addons/meitheal-hub/     # HA OS add-on
│   ├── Dockerfile
│   ├── config.yaml
│   ├── run.sh
│   └── rootfs/etc/
│       ├── alloy/config.river
│       └── grafana/dashboards/compat-api.json
├── apps/
│   ├── api/                 # Cloudflare Workers adapter (skeleton)
│   └── web/                 # Astro SSR application (22 source files)
│       ├── drizzle/         # Schema + migrations
│       ├── scripts/         # Build/CI scripts (5 files)
│       └── src/
│           ├── content/config.ts
│           ├── domains/
│           │   ├── auth/ingress.ts
│           │   ├── integrations/vikunja-compat/
│           │   │   ├── auth.ts
│           │   │   ├── compat-logger.ts    # NEW: structured request logging
│           │   │   ├── http.ts
│           │   │   └── store.ts
│           │   └── tasks/
│           │       ├── persistence/store.ts
│           │       └── task-sync-service.ts
│           ├── middleware.ts
│           └── pages/
│               ├── api/     # 11 API endpoints (4 native + 7 compat)
│               └── index.astro
├── docs/
│   ├── decisions/           # 6 ADRs (0001–0006)
│   ├── kcs/                 # 5 KCS docs
│   ├── methodologies/       # Framework docs
│   └── prfaq/               # Product FAQ docs
├── integrations/home-assistant/  # HACS custom component
├── packages/
│   ├── domain-auth/
│   ├── domain-observability/
│   ├── domain-strategy/
│   ├── domain-tasks/
│   └── integration-core/
├── tests/
│   ├── e2e/                 # 22 Playwright specs (21 + new timezone test)
│   ├── governance/          # 1 spec (repo standards)
│   └── scripts/             # Live verification scripts
├── AGENTS.md
├── README.md
├── SKILL.md
├── WEBMCP.md
├── package.json
├── pnpm-workspace.yaml
├── repository.yaml
└── tsconfig.base.json
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/middleware.ts` | Ingress auth for all requests |
| `packages/domain-tasks/src/vertical-slice.ts` | Task create + calendar sync (173 lines) |
| `packages/integration-core/src/home-assistant-calendar.ts` | HA calendar adapter (166 lines) |
| `apps/web/src/domains/integrations/vikunja-compat/compat-logger.ts` | Structured compat logging |
| `apps/web/scripts/perf-budget-check.mjs` | CI performance enforcement |
| `addons/meitheal-hub/run.sh` | HA add-on startup |
| `addons/meitheal-hub/rootfs/etc/grafana/dashboards/compat-api.json` | Grafana dashboard |
| `docs/decisions/0006-iteration-05-integrations-rfc.md` | Next iteration RFC |

## Where to Add New Code

| What | Where |
|------|-------|
| New domain package | `packages/domain-<name>/` + register in `pnpm-workspace.yaml` |
| New API route | `apps/web/src/pages/api/` (Astro file-based routing) |
| New integration adapter | `packages/integration-core/src/` |
| New E2E test | `tests/e2e/<name>.spec.ts` |
| New governance test | `tests/governance/<name>.spec.ts` |
| New ADR | `docs/decisions/000N-<name>.md` |
| New KCS doc | `docs/kcs/<name>.md` |
| New Grafana dashboard | `addons/meitheal-hub/rootfs/etc/grafana/dashboards/` |

## Naming

- **Files:** kebab-case (`task-sync-service.ts`, `compat-logger.ts`)
- **Test specs:** `<feature>.spec.ts` or `<feature>.spec.mjs`
- **Domain packages:** `domain-<context>` prefix
- **Exports:** Named only (no default exports)
- **Barrel files:** `index.ts` in each package

---

*Structure analysis: 2026-02-28 @ 9b9f2ab*
