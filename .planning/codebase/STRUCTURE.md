# Directory Structure

> Last mapped: 2026-03-09 — v0.1.99

## Root Layout

```
meitheal/
├── .agents/rules/workflows/     # Agent rules and GSD workflows
├── .devcontainer/               # HA devcontainer for Tier 2 testing
├── .github/workflows/           # CI: governance, typecheck, tests, docker
├── .planning/codebase/          # THIS — codebase mapping docs
├── .skills/core-workflows/      # Agent skills (SKILL.md)
├── .zeroclaw/                   # Agent identity (soul.md)
├── apps/
│   ├── api/                     # @meitheal/api — Cloudflare Workers (future)
│   └── web/                     # @meitheal/web — Main Astro SSR app ★
├── docs/
│   ├── decisions/               # ADRs
│   ├── kcs/                     # KCS runbooks (pwa-offline-guide, etc.)
│   └── methodologies/           # DDD, RICE, KCS docs
├── integrations/
│   ├── blueprints/              # HA automation blueprints
│   └── home-assistant/          # HA custom components
├── meitheal-hub/                # HA Add-on packaging ★
│   ├── config.yaml              # Add-on manifest (version, ingress, schema)
│   ├── Dockerfile               # Multi-arch Docker build
│   ├── run.sh                   # Addon entrypoint (bashio)
│   ├── rootfs/                  # Filesystem overlay (services, backup hooks)
│   └── translations/            # Add-on UI translations (en.yaml)
├── packages/                    # Domain packages ★
│   ├── domain-auth/             # CSRF, ingress, session
│   ├── domain-observability/    # Structured logger
│   ├── domain-strategy/         # RICE scoring
│   ├── domain-tasks/            # Task aggregates
│   └── integration-core/        # Calendar, webhooks, A2A
├── tests/                       # @meitheal/tests ★
│   ├── e2e/                     # 30 end-to-end specs
│   ├── governance/              # IQS platinum governance
│   └── unit/                    # 18 unit specs
├── AGENTS.md                    # Agent behavior rules
├── WEBMCP.md                    # Agent protocol docs
└── pnpm-workspace.yaml          # Workspace packages
```

## apps/web/src/ — Main Application

```
src/
├── components/ (34 Astro components)
│   ├── gamification/     # Confetti, GamificationWidget, StreakBadge
│   ├── ha/               # AskAssistModal, TypingIndicator
│   ├── layout/           # Sidebar, TopNavigation, BoardSwitcher, NavList, Footer
│   ├── pwa/              # PwaInstallBanner
│   ├── settings/         # General, Integrations, Labels, Agents, System
│   ├── tasks/            # NewTaskModal, StrategicEvaluator, TaskViewTabs
│   └── ui/               # EmptyState, Icon, HelpTooltip, LabelBadges, etc. (14)
├── domains/ (17 bounded contexts)
│   ├── ai/               # ha-assist-service, ai-context-service
│   ├── auth/             # ingress-policy, ingress
│   ├── calendar/         # caldav-client, calendar-bridge
│   ├── gamification/     # XP engine, streak-tracker
│   ├── grocy/            # grocy-bridge, grocy-mapper
│   ├── ha/               # connection, entities, events, services, users, startup
│   ├── labels/           # label-store, label-color-resolver
│   ├── notifications/    # due-date-reminders
│   ├── offline/          # offline-store, sync-engine, tab-sync, notifications
│   ├── tasks/            # persistence/store.ts, recurrence, task-sync-service
│   └── todo/             # todo-bridge, todo-status-mapper
├── layouts/Layout.astro  # Master layout
├── lib/ (33 utilities)   # api-response, safe-fetch, task-api-client, toast, etc.
├── pages/ (12 pages + 64 API routes)
│   ├── api/              # 64 endpoints (see INTEGRATIONS.md)
│   └── *.astro           # index, kanban, table, tasks, today, upcoming, etc.
├── styles/ (17 CSS partials)
├── types/window.d.ts     # Global Window type extensions
└── middleware.ts          # Security, ingress, rate limiting, DB init
```

## Key File Locations

| What | Where |
|------|-------|
| Add-on version | `meitheal-hub/config.yaml` → `version:` |
| Run version | `meitheal-hub/run.sh` → `MEITHEAL_VERSION` |
| SW cache version | `apps/web/public/sw.js` → `CACHE_VERSION` |
| DB schema | `apps/web/src/domains/tasks/persistence/store.ts` |
| DB file (prod) | `/data/meitheal.db` |
| DB file (dev) | `apps/web/.data/meitheal.db` |
| Middleware | `apps/web/src/middleware.ts` |
| Ingress wrapper | `apps/web/scripts/serve.mjs` |
| Astro config | `apps/web/astro.config.mjs` |
| CI pipeline | `.github/workflows/ci.yml` |
| Docker build | `meitheal-hub/Dockerfile` |
| Test config | `tests/playwright.config.ts` |
| Path aliases | `apps/web/tsconfig.json` (`@domains/` → `src/domains/`) |
