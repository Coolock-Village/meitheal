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
- Execution plans `20-01` through `20-04` mapped.

## Open Blockers (Roadmap-Level)

1. PR #1 still has failing required checks.
2. `perf-budgets` fails on CI runs `22519500812` and `22519501663` (`clientBytes=81700` vs `65536`).
3. CodeQL check-suite reports a failing entry even though newer dynamic analysis runs have succeeded; required-check reconciliation is still needed.

---
*Last updated: 2026-02-28 during extension-track reconciliation pass*
