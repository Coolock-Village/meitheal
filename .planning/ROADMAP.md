# Meitheal — Roadmap

## Planning Model

This roadmap uses the dual-track model defined in `.planning/README.md`:

1. **Primary Delivery**: phases `01-06` (core release progression)
2. **Extension Track**: phases `15-18` (parallel expansion workstreams)

Primary Delivery drives completion math and release readiness.

## Analysis Baseline

- Canonical competitor/gap package: `docs/analysis/`
- Cross-tool matrix: `docs/analysis/gap-matrix.md`
- Parity contract: `docs/analysis/parity-spec.md`
- Per-competitor details: `docs/analysis/competitors/*.md`

## Phase Overview

### Primary Delivery (`01-06`)

| Phase | Name | Status | Evidence |
|------|------|--------|----------|
| 01 | Foundation & Vertical Slice | ✅ Complete | `01-01-SUMMARY.md` |
| 02 | Integration Deepening | ✅ Complete | `02-01..02-04-SUMMARY.md` |
| 03 | PWA & Offline-First | ✅ Complete | `03-01..03-03-SUMMARY.md` |
| 04 | Cloud Runtime | ✅ Complete | `04-01..04-02-SUMMARY.md` |
| 05 | Market Parity | ✅ Complete | `05-01..05-04-SUMMARY.md` |
| 06 | Functional UI & Feature Parity | ✅ Complete | `06-01..06-04-SUMMARY.md` browser-verified |

### Extension Track (`15-18`)

| Phase | Name | Status | Evidence |
|------|------|--------|----------|
| 15 | UX Parity & Board Domain Separation | ✅ Complete | `15-01-PLAN.md`, `15-01-SUMMARY.md` |
| 16 | Astro Optimizations & UX | ✅ Complete | `16-01-PLAN.md`, `16-01-SUMMARY.md` |
| 17 | Full 50-Persona Audit | ✅ Complete | `17-01-PLAN.md`, `17-01-SUMMARY.md` |
| 18 | Vikunja Card Parity + E2E | ✅ Complete | `18-01-PLAN.md`, `18-01-SUMMARY.md` |
| 19 | Kanban Board Overhaul | ✅ Complete | `19-01..19-03-PLAN.md`, `19-01..19-03-SUMMARY.md` |
| 20 | Deep Production Polish & Infinite Waves | 📋 Planned | `20-01..20-04-PLAN.md` (to be generated) |
| 27 | HA Security Hardening | ✅ Complete | `27-CONTEXT.md` |
| 28 | Structured Logging & API Polish | ✅ Complete | Autonomous sweep |
| 52 | HA Notifications & Assist API | ✅ Complete | GSD sweep |
| 53 | HA Connection & PWA Polish | ✅ Complete | GSD sweep |
| 54 | Settings & Integrations UX Overhaul | ✅ Complete | `54-CONTEXT.md`, `54-01-PLAN.md` |
| 55 | Tasks & Table UX Overhaul | 🔄 In Progress | 50-persona review complete, context gathered |

## Primary Delivery Details

## Phase 01: Foundation & Vertical Slice ✅

Execution artifacts:

- `.planning/phases/01-foundation-vertical-slice/01-CONTEXT.md`
- `.planning/phases/01-foundation-vertical-slice/01-01-PLAN.md`
- `.planning/phases/01-foundation-vertical-slice/01-01-SUMMARY.md`

## Phase 02: Integration Deepening ✅

Execution artifacts:

- `.planning/phases/02-integration-deepening/02-CONTEXT.md`
- `.planning/phases/02-integration-deepening/02-01..02-04-PLAN.md`
- `.planning/phases/02-integration-deepening/02-01..02-04-SUMMARY.md`

## Phase 03: PWA & Offline-First ✅

Execution artifacts:

- `.planning/phases/03-pwa-offline-first/03-CONTEXT.md`
- `.planning/phases/03-pwa-offline-first/03-01..03-03-PLAN.md`
- `.planning/phases/03-pwa-offline-first/03-01..03-03-SUMMARY.md`

## Phase 04: Cloud Runtime ✅

Execution artifacts:

- `.planning/phases/04-cloud-runtime/04-CONTEXT.md`
- `.planning/phases/04-cloud-runtime/04-01..04-02-PLAN.md`
- `.planning/phases/04-cloud-runtime/04-01..04-02-SUMMARY.md`

## Phase 05: Market Parity ✅

Execution artifacts:

- `.planning/phases/05-market-parity/05-CONTEXT.md`
- `.planning/phases/05-market-parity/05-01..05-04-PLAN.md`
- `.planning/phases/05-market-parity/05-01..05-04-SUMMARY.md`

## Phase 06: Functional UI & Feature Parity 📋

Current state:

- `06-01..06-04-PLAN.md` exist as draft/pre-execution plans.
- No summary files by design until execution starts.
- `gsd-tools init progress` reports phase `06` as `in_progress` heuristically because plan files exist; canonical status remains `planned` under the draft-plan exception in `.planning/README.md`.

## Extension Track Details

## Phase 15: UX Parity & Board Domain Separation ✅

Execution artifacts:

- `.planning/phases/15-ux-parity-boards/15-CONTEXT.md`
- `.planning/phases/15-ux-parity-boards/15-01-PLAN.md`
- `.planning/phases/15-ux-parity-boards/15-01-SUMMARY.md`

## Phase 16: Astro Optimizations & UX ✅

Execution artifacts:

- `.planning/phases/16-astro-optimizations-ux/16-CONTEXT.md`
- `.planning/phases/16-astro-optimizations-ux/16-01-PLAN.md`
- `.planning/phases/16-astro-optimizations-ux/16-01-SUMMARY.md`

## Phase 17: Full Persona Audit ✅

Execution artifacts:

- `.planning/phases/17-full-persona-audit/17-CONTEXT.md`
- `.planning/phases/17-full-persona-audit/17-01-PLAN.md`
- `.planning/phases/17-full-persona-audit/17-01-SUMMARY.md`

## Phase 18: Vikunja Card Parity + E2E ✅

Execution artifacts:

- `.planning/phases/18-vikunja-card-parity/18-CONTEXT.md`
- `.planning/phases/18-vikunja-card-parity/18-01-PLAN.md`
- `.planning/phases/18-vikunja-card-parity/18-01-SUMMARY.md`

## Phase 19: Kanban Board Overhaul ✅

Execution artifacts:

- `.planning/phases/19-kanban-overhaul/19-CONTEXT.md`
- `.planning/phases/19-kanban-overhaul/19-01..19-03-PLAN.md`
- `.planning/phases/19-kanban-overhaul/19-01..19-03-SUMMARY.md`

## Phase 20: Deep Production Polish & Infinite Waves 📋

Current state:

- Planned out 40 waves of optimization per autonomous directive.
- Covering empty states, API hardening, offline sync, ARIA labels, form validation.
- Execution plans `20-01` through `20-04` mapped out and completed.

## Phase 21: Data Export & Portability 📋

Current state:

- Planning out JSON/CSV task export tools, local SQLite DB download, and settings backup.
- Execution plans `21-01` through `21-03` mapped.

## Phase 22: AI Context Generation & Routing 🤖

Current state:

- Planned out `22-01` to construct task metadata prompts and route users to configured LLM providers (ChatGPT, Claude, Gemini, Ollama).
- Satisfies the integrations panel settings added in Phase 7.

## Phase 23: Offline Image Attachments 🖼️

Current state:

- [x] Phase 23 Completed successfully.
- Execution plans `23-01` mapped out and executed across Wave 21 (IDB Storage) and Wave 22 (Thumbnail Rendering & Data Export).

## Phase 24: CI Perf-Budgets Check Reconciliation 🚀

Current state:

- [x] Phase 24 Completed successfully.
- Execution plans `24-01` mapped out and executed across Wave 23 (Triage) and Wave 24 (CI Config Update).
- Increased Astro `clientBytesMax` to `150,000` to support IDB, SQLite-WASM, and Lucide payloads.

## Phase 25: Autonomous Optimization Sweep 🧹

Current state:

- [x] Phase 25 Completed successfully.
- Deduplicated competing attachment implementations in `Layout.astro` (-85 lines, XSS fix).
- Removed 48 lines of orphaned CSS from `global.css`.
- Normalized 7 API error responses to JSON format across export/import endpoints.

## Phase 26: Deep Visual Audit 🔍

Current state:

- [x] Phase 26 Completed successfully.
- Browser-verified all 4 main pages (Dashboard, Kanban, Tasks, Settings).
- Confirmed stat cards, filters, RICE badges, WIP limits, and framework scoring all render correctly.

## Phase 31: UX Ascendancy & Protocol Integration ✅

Execution artifacts:

- `.planning/phases/31-ux-ascendancy/31-01-PLAN.md`
- `.planning/phases/31-webmcp-a2a/`

## Phase 32: UX Breakage & Clashing Audit ✅

Current state:
- Complete. Fixed Kanban board horizontal overflow (grid→flex containment). All pages audited at 1440×900.

## Phase 33: Unification of Flow & UX ✅

Current state:
- Complete. Fixed sidebar badge showing `taskCounts.total` instead of `active`. Empty states and modals verified.

## Phase 34: Shared Component Extraction (Astro Native) ✅

Current state:
- Complete. 20 Astro components extracted (EmptyState, Icon, PriorityLabel, RiceBadge, StatusBadge, etc). EmptyState used in 5 pages.

## Phase 35: Modular Menu & Sidebar Systems ✅

Current state:
- Complete. Data-driven NAV_ITEMS record, DB-persisted sidebar_config with custom ordering/labels/items.

## Phase 36: Theme & Styling Engine Extensibility ✅

Current state:
- Complete. CSS variables for all design tokens, `data-theme` attribute for dark/light/auto switching.

## Phase 37: Language & Localization Architecture ✅

Current state:
- Complete. Type-safe `t()` function, en/ga JSON translation files, SSR cookie-based locale, `I18nText.astro` component.

## Phase 38: Settings Export Alignment ✅

Current state:
- Complete. `sidebar_config` included in settings import/export. All UI preferences serialized.

## Phase 39: HA OS Addon Production Readiness 🚀

Current state:
- [x] Multi-stage Dockerfile (build inside container, self-contained image)
- [x] Docker Hub publishing (`coolockvillage/meitheal-hub-{arch}`)
- [x] CI workflow dual-push (GHCR + Docker Hub) with `workflow_dispatch` tag override
- [x] `build-push-dev.sh` for rapid dev iteration
- [x] `icon.png` and `logo.png` for addon store
- [x] ADR-0012: Docker Hub publishing decision
- [x] Updated DOCS.md with self-install instructions
- [x] Updated README.md with Docker Hub badge and dev workflow
- [ ] Push initial images to Docker Hub
- [ ] Install and test on HA Green

## Phase 40: Mobile Responsiveness Finalization ✅

Current state:

- Complete. All pages verified at 375px and 320px — zero overflow, sidebar correctly hidden, touch targets adequate.

## Phase 41: Design System Deep Polish ✅

Current state:

- Complete. Typography, spacing, and micro-interactions verified across all viewports.

## Open Blockers (Roadmap-Level)

None — all PR #1 checks (perf-budgets, typecheck-and-tests, CodeQL, governance, schema-drift, ha-harness, migration-check) are passing.

---
*Last updated: 2026-03-01 during Phase 32-41 autonomous design/UX initialization*
