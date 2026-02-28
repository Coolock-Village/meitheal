# ADR 0007: Competitor Gap Matrix and Parity Contract

## Status
Accepted

## Date
2026-02-28

## Context
Meitheal requirements and roadmap referenced parity goals (Vikunja and Super Productivity) but lacked a single canonical analysis package with explicit per-competitor breakdowns and acceptance-oriented parity targets.

Without this, roadmap evolution and implementation prioritization risked drift and repeated rediscovery.

## Decision
Adopt `docs/analysis/` as the canonical competitor and parity source for planning decisions.

### Canonical Files
- `docs/analysis/gap-matrix.md`
- `docs/analysis/parity-spec.md`
- `docs/analysis/competitors/*.md`

### Process Contract
1. Roadmap and project requirement changes that reference market parity must trace to `docs/analysis/*`.
2. Phase planning should cite relevant competitor documents when selecting priorities.
3. Parity checks must reference `parity-spec.md` acceptance criteria in plan summaries and verification steps.
4. Analysis docs are living artifacts and should be updated when capability assumptions materially change.

## Consequences
- Improves planning consistency and auditability.
- Reduces ambiguity in "parity" discussions.
- Increases documentation overhead, but provides better decision traceability.

## Related
- `docs/decisions/0002-target-architecture.md`
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
