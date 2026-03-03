# Codebase Structure

**Analysis Date:** 2026-03-03
**Version:** 0.2.6

## Directory Layout

```
meitheal/
├── .agents/rules/           # Agent behavior rules (autonomous.md, design-and-ux.md)
├── .github/workflows/       # CI/CD (ci.yml, publish-addon, live-ha, live-vikunja)
├── .planning/               # GSD planning (codebase map, persona loops)
├── .skills/                 # Agent skill definitions
├── .zeroclaw/               # AI soul file
├── meitheal-hub/            # HA OS add-on
│   ├── Dockerfile
│   ├── config.yaml
│   ├── run.sh
│   └── rootfs/etc/
│       ├── alloy/config.river
│       └── grafana/dashboards/compat-api.json
├── apps/
│   ├── api/                 # Cloudflare Workers adapter (skeleton)
│   └── web/                 # Astro SSR application
│       ├── drizzle/         # Schema + 3 migrations
│       ├── scripts/         # Build/CI scripts + serve.mjs wrapper
│       └── src/
│           ├── content/config.ts
│           ├── domains/
│           │   ├── auth/ingress.ts
│           │   ├── auth/ingress-policy.ts  # Ingress context from X-Ingress-Path
│           │   ├── ha/ha-events.ts         # HA WebSocket events
│           │   ├── integrations/vikunja-compat/
│           │   │   ├── auth.ts
│           │   │   ├── compat-logger.ts
│           │   │   ├── http.ts
│           │   │   └── store.ts
│           │   ├── todo/                   # HA todo list sync
│           │   │   ├── todo-bridge.ts
│           │   │   └── todo-status-mapper.ts
│           │   └── tasks/
│           │       ├── persistence/store.ts
│           │       └── task-sync-service.ts
│           ├── middleware.ts
│           └── pages/
│               ├── api/     # 42 API endpoint files
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
│   ├── e2e/                 # 38 Playwright specs
│   ├── governance/          # Governance specs
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
| `apps/web/src/middleware.ts` | Ingress auth, CSP, CSRF, rate limiting |
| `apps/web/scripts/serve.mjs` | Ingress-safe HTTP wrapper (prevents 301 loops) |
| `packages/domain-tasks/src/vertical-slice.ts` | Task create + calendar sync (173 lines) |
| `packages/integration-core/src/home-assistant-calendar.ts` | HA calendar adapter (166 lines) |
| `apps/web/src/domains/auth/ingress-policy.ts` | Ingress context detection |
| `apps/web/src/domains/ha/ha-events.ts` | HA WebSocket event bridge |
| `apps/web/scripts/perf-budget-check.mjs` | CI performance enforcement |
| `meitheal-hub/run.sh` | HA add-on startup (uses serve.mjs wrapper) |
| `docs/decisions/0006-iteration-05-integrations-rfc.md` | Next iteration RFC |

## Where to Add New Code

| What | Where |
|------|-------|
| New domain package | `packages/domain-<name>/` + register in `pnpm-workspace.yaml` |
| New API route | `apps/web/src/pages/api/` (Astro file-based routing) |
| New integration adapter | `packages/integration-core/src/` |
| New E2E test | `tests/e2e/<name>.spec.ts` |
| New governance test | `tests/governance/<name>.spec.ts` |
| New ADR | `docs/decisions/000N-<name>.md` (currently 12) |
| New KCS doc | `docs/kcs/<name>.md` (currently 11) |
| New Grafana dashboard | `meitheal-hub/rootfs/etc/grafana/dashboards/` |

## Naming

- **Files:** kebab-case (`task-sync-service.ts`, `compat-logger.ts`)
- **Test specs:** `<feature>.spec.ts` or `<feature>.spec.mjs`
- **Domain packages:** `domain-<context>` prefix
- **Exports:** Named only (no default exports)
- **Barrel files:** `index.ts` in each package

---

*Structure analysis: 2026-03-03 — v0.2.6*
