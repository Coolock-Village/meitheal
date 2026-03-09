# Technology Stack

> Last mapped: 2026-03-09 — v0.1.99

## Runtime

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | TypeScript | 5.9.3 |
| Runtime | Node.js | 22 LTS |
| Framework | Astro SSR | 5.18.0 |
| Node Adapter | @astrojs/node | 9.5.4 |
| Package Manager | pnpm | 10.8.0 |
| Monorepo | pnpm workspaces | — |

## Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `astro` | ^5.18.0 | SSR framework (pages, API routes, middleware) |
| `@astrojs/node` | ^9.5.4 | Node.js SSR adapter for standalone server |
| `@astrojs/mdx` | ^4.3.13 | MDX content support |
| `@astrojs/sitemap` | ^3.7.0 | Auto-generate sitemap |
| `@astrojs/tailwind` | ^6.0.2 | Tailwind CSS integration (dev) |
| `tailwindcss` | ^3.4.19 | Utility-first CSS (dev) |
| `drizzle-orm` | ^0.45.1 | Type-safe ORM (schema definition only) |
| `drizzle-kit` | ^0.31.9 | Drizzle migration tooling (dev) |
| `@libsql/client` | ^0.17.0 | SQLite client (libSQL/Turso compatible) |
| `date-fns` | ^4.1.0 | Date manipulation |
| `date-fns-tz` | ^3.2.0 | Timezone-aware date handling |
| `home-assistant-js-websocket` | ^9.6.0 | HA WebSocket client |
| `ws` | ^8.19.0 | WebSocket server |
| `zod` | ^4.3.6 | Runtime schema validation |
| `marked` | ^17.0.4 | Markdown → HTML rendering |
| `sanitize-html` | ^2.17.1 | XSS prevention for user HTML |
| `undici` | ^7.22.0 | HTTP client (faster than native fetch) |
| `postcss-import` | ^16.1.1 | CSS @import resolution |

## Fonts

| Font | Package | Usage |
|------|---------|-------|
| Inter | `@fontsource-variable/inter` | Primary UI font |
| Geist | `@fontsource-variable/geist` | Monospace alternative |
| JetBrains Mono | `@fontsource/jetbrains-mono` | Code/ticket numbers |
| Outfit | `@fontsource/outfit` | Headings |

## Workspace Packages

| Package | Path | Purpose |
|---------|------|---------|
| `@meitheal/web` | `apps/web/` | Astro SSR app — UI, API, middleware |
| `@meitheal/api` | `apps/api/` | Cloudflare Workers API (future) |
| `@meitheal/domain-tasks` | `packages/domain-tasks/` | Task aggregates, vertical slices |
| `@meitheal/domain-auth` | `packages/domain-auth/` | CSRF, ingress detection, session |
| `@meitheal/domain-strategy` | `packages/domain-strategy/` | RICE scoring, strategic evaluation |
| `@meitheal/domain-observability` | `packages/domain-observability/` | Structured logger, redaction |
| `@meitheal/integration-core` | `packages/integration-core/` | Calendar adapters, webhooks, A2A |
| `@meitheal/tests` | `tests/` | Playwright test suite |
| `meitheal-dev-nodered` | `.devcontainer/nodered/` | Dev Node-RED flows |

## Database

| Aspect | Detail |
|--------|--------|
| Engine | SQLite via `@libsql/client` |
| Location | `/data/meitheal.db` (addon), `.data/meitheal.db` (local) |
| ORM | Raw SQL via `client.execute()` (not Drizzle query builder) |
| Migrations | `apps/web/scripts/migrate.mjs` |
| Schema drift | `apps/web/scripts/schema-drift-check.mjs` |
| Tables | `tasks`, `boards`, `kanban_lanes`, `comments`, `task_activity_log`, `domain_events`, `integration_attempts`, `calendar_confirmations`, `audit_trail`, `settings`, `saved_filters`, `task_templates`, `labels`, `custom_users` |
| Indexes | 15+ covering task lookups, events, calendar sync |

## CSS Architecture

17 partials imported via `global.css`:

| File | Purpose |
|------|---------|
| `_tokens.css` | Design tokens (colors, spacing, breakpoints) |
| `_base.css` | Reset, typography, root styles |
| `_layout.css` | Page layout, sidebar, main content |
| `_buttons.css` | Button variants |
| `_cards.css` | Card components |
| `_feedback.css` | Toasts, skeletons, empty states |
| `_forms.css` | Form inputs, selects |
| `_kanban.css` | Kanban board styles |
| `_labels.css` | Label badges |
| `_modal.css` | Modal dialogs |
| `_responsive.css` | Media queries |
| `_search.css` | Search/command palette |
| `_table.css` | Table view styles |
| `_tasks.css` | Task cards, task detail |
| `_utilities.css` | Utility classes |
| `_avatar.css` | User avatars |

## Build & Deploy

| Aspect | Detail |
|--------|--------|
| Build | `astro build` → `dist/` |
| Serve | `scripts/serve.mjs` (custom HTTP wrapper for ingress) |
| Container | `meitheal-hub/Dockerfile` |
| Registry | `ghcr.io/coolock-village/meitheal-{arch}` |
| Architectures | amd64, aarch64 |
| CI | GitHub Actions: governance, typecheck, tests, HA harness, Docker |
| Tag deploy | Push `v*` tag → Docker build + publish |
| Version sync | `config.yaml`, `run.sh`, `sw.js` must all match |

## Dev Tools

| Tool | Purpose |
|------|---------|
| `astro check` | TypeScript type checking |
| `pnpm check` | Typecheck all packages |
| `pnpm --filter @meitheal/tests test` | Run Playwright tests |
| `scripts/perf-budget-check.mjs` | Performance budget validation |
| `.devcontainer/` | HA devcontainer for integration testing |
| `scripts/devcontainer-up.sh` | Start HA devcontainer stack |
| CodeRabbit | Automated PR review |
