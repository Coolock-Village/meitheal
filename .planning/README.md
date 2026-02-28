# Meitheal Planning Contract

This document defines how `.planning/` is interpreted in Meitheal.

## Tracks

Meitheal planning uses two tracks:

1. `Primary Delivery` phases `01-06`
2. `Extension Track` phases `15-18`

Primary Delivery is authoritative for core completion math and release readiness.
Extension Track phases are optional extensions unless explicitly promoted into Primary Delivery.

## Phase Status Semantics

1. `planned`
- Context may exist.
- Plans may exist as draft backlogs.
- No execution summary is required yet.

2. `in_progress`
- Context exists.
- At least one plan is being actively executed.
- At least one implementation log or equivalent execution evidence exists.

3. `complete`
- Context exists.
- Executed plans have paired summaries.
- Summaries cite concrete evidence (commits/tests/logs).

## Completion Rules

A phase can only be marked `complete` when:

1. `*-CONTEXT.md` exists.
2. Each executed `*-PLAN.md` has a corresponding `*-SUMMARY.md`.
3. Each summary contains concrete evidence references.

## Draft Plan Rule

Phases may contain draft plans while still `planned`.
Draft plans must be clearly marked `Draft / Pre-execution` and do not require summary files until execution begins.

### Tooling note

`gsd-tools init progress` heuristically marks any phase with `PLAN` files and no summaries as `in_progress`.
When plans are explicitly marked `Draft / Pre-execution`, Meitheal treats the canonical status as `planned` until execution starts.

## Required Summary Template

Every `*-SUMMARY.md` must include these sections in order:

1. `Objective`
2. `Delivered Changes`
3. `Verification Evidence`
4. `Risk/Regression Notes`
5. `Confidence` (`high|medium|low`)
6. `Evidence Gaps`

## Persona Loop Classification

Persona loop folders are classified in `.planning/persona-loops/INDEX.md` as:

1. `execution-linked` (used to gate roadmap progress)
2. `exploratory` (insight-only, non-gating)
3. `historical import` (imported legacy artifacts)

No persona-loop artifacts are deleted during normalization passes unless explicitly approved.
