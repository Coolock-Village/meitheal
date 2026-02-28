# Codebase Structure

**Analysis Date:** 2026-02-28

## Directory Layout

```
meitheal/
├── .github/workflows/       # CI and publishing workflows
├── .planning/               # GSD planning artifacts
├── .skills/                 # Antigravity/agent skill definitions
├── .zeroclaw/               # AI agent soul file
├── addons/meitheal-hub/     # HA OS add-on package
├── apps/
│   ├── api/                 # Cloudflare Workers adapter (skeleton)
│   └── web/                 # Astro SSR application (primary)
├── docs/
│   ├── decisions/           # ADRs (5 decisions)
│   ├── kcs/                 # KCS runbooks (5 docs)
│   ├── methodologies/       # Framework methodology docs
│   └── prfaq/               # Product FAQ docs
├── integrations/
│   └── home-assistant/      # HA custom component skeleton
├── packages/
│   ├── domain-auth/         # Auth bounded context
│   ├── domain-observability/# Logging and audit
│   ├── domain-strategy/     # Framework scoring (RICE)
│   ├── domain-tasks/        # Task lifecycle and vertical slice
│   └── integration-core/    # Calendar adapter interface + HA impl
├── public/
│   └── .well-known/         # MCP and JSON discovery
├── tests/
│   ├── e2e/                 # 21 Playwright test specs
│   ├── governance/          # Repo standards enforcement
│   └── scripts/             # Live verification scripts
├── AGENTS.md                # Contributor rules (CI enforced)
├── README.md                # Project overview and ubiquitous language
├── SKILL.md                 # Skill index for AI contributors
├── WEBMCP.md                # WebMCP configuration
├── package.json             # Root monorepo config
├── pnpm-workspace.yaml      # Workspace definition
├── repository.yaml          # HA add-on repository manifest
└── tsconfig.base.json       # Shared TypeScript config
```

## Directory Purposes

**`apps/web/`:**
- Purpose: Primary Astro SSR application
- Contains: Pages, API routes, middleware, domain implementations, scripts, content schemas
- Key files: `astro.config.mjs`, `src/middleware.ts`, `src/pages/api/`

**`apps/web/src/domains/`:**
- Purpose: App-level domain implementations (bridge between domain packages and Astro)
- Contains: Auth ingress logic, task persistence/sync, vikunja-compat surface
- Key files: `auth/ingress.ts`, `tasks/persistence/store.ts`, `tasks/task-sync-service.ts`, `integrations/vikunja-compat/`

**`apps/web/scripts/`:**
- Purpose: Build and CI scripts
- Contains: `migrate.mjs`, `schema-drift-check.mjs`, `perf-budget-check.mjs`, `split-sql-statements.mjs`, `perf-budget-baseline.json`

**`packages/domain-tasks/src/`:**
- Purpose: Pure task domain logic
- Contains: Task entity (`task.ts`), vertical slice with events (`vertical-slice.ts`), public API (`index.ts`)

**`addons/meitheal-hub/`:**
- Purpose: HA OS add-on distribution package
- Contains: `Dockerfile`, `run.sh`, `config.yaml`, `build.json`, `DOCS.md`, Alloy config

## Key File Locations

**Entry Points:**
- `apps/web/dist/server/entry.mjs`: Production server (built)
- `apps/web/src/pages/index.astro`: Home page
- `addons/meitheal-hub/run.sh`: Add-on startup script

**Configuration:**
- `apps/web/astro.config.mjs`: Astro config
- `apps/web/drizzle.config.ts`: Database config
- `addons/meitheal-hub/config.yaml`: HA add-on options schema
- `apps/web/scripts/perf-budget-baseline.json`: CI performance thresholds

**Core Logic:**
- `packages/domain-tasks/src/vertical-slice.ts`: Task create + calendar sync orchestration (173 lines)
- `packages/integration-core/src/home-assistant-calendar.ts`: HA calendar adapter (166 lines)
- `apps/web/src/domains/tasks/persistence/store.ts`: SQLite persistence layer
- `apps/web/src/domains/integrations/vikunja-compat/`: Vikunja compatibility API

**Testing:**
- `tests/e2e/ha-calendar-adapter.spec.ts`: HA integration test (4.3KB)
- `tests/e2e/task-sync-persistence.spec.ts`: Persistence tests (5.4KB)
- `tests/governance/repo-standards.spec.ts`: CI governance gate

## Naming Conventions

**Files:**
- kebab-case: `task-sync-service.ts`, `home-assistant-calendar.ts`
- Spec suffix: `*.spec.ts`, `*.spec.mjs`

**Directories:**
- kebab-case: `domain-tasks`, `integration-core`, `vikunja-compat`
- DDD bounded context prefix: `domain-*`

## Where to Add New Code

**New Domain Package:**
- Create `packages/domain-<name>/` with `src/index.ts` and `package.json`
- Register in `pnpm-workspace.yaml`

**New API Route:**
- Add file to `apps/web/src/pages/api/`
- Follow Astro file-based routing conventions

**New Integration:**
- Implement `CalendarIntegrationAdapter` in `packages/integration-core/`
- Wire in `apps/web/src/domains/integrations/`

**New Test:**
- E2E: `tests/e2e/<name>.spec.ts`
- Governance: `tests/governance/<name>.spec.ts`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning and persona loop artifacts
- Generated: By GSD workflows and agent loops
- Committed: Yes (tracked in git)

**`apps/web/dist/`:**
- Purpose: Astro build output
- Generated: Yes (`astro build`)
- Committed: Yes (needed for HA add-on runtime)

---

*Structure analysis: 2026-02-28*
