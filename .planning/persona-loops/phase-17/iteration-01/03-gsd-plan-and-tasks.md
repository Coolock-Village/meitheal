# GSD Plan & Tasks — Phase 17 Iteration 01

## Task Backlog (Audit Setup and Wave Plan)

1. `P17-I01-T1` (P0)
- Publish phase-17 severity rubric and closure policy (critical/high/medium/low, SLA expectations).
- Trace: Frontier CISO.

2. `P17-I01-T2` (P0)
- Capture baseline evidence bundle (`pnpm check`, tests, perf budget, schema drift) and store in implementation log.
- Trace: Frontier QA Architect.

3. `P17-I01-T3` (P0)
- Build findings register template with required fields: domain, control tag, severity, reproduction, owner, status.
- Trace: ADHD Focus Optimizer + Knowledge Coach.

4. `P17-I01-T4` (P1)
- Convert `17-01-PLAN.md` domains into wave schedule with WIP limit and per-wave acceptance criteria.
- Trace: Frontier Delivery Manager.

5. `P17-I01-T5` (P1)
- Define DDD boundary compliance checklist for all audit fix PRs.
- Trace: Frontier DDD Steward.

6. `P17-I01-T6` (P1)
- Add compliance mapping tags (SOC2/ISO/WCAG/OWASP) to finding schema.
- Trace: Frontier Compliance Lead.

## Execution Shape

- Wave A: setup (`T1`, `T2`, `T3`)
- Wave B: audit orchestration (`T4`, `T5`, `T6`)
- Wave C: domain audits and remediation cycles

## Validation Targets

- `npx pnpm check`
- `npx pnpm --filter @meitheal/tests test`
- `npx pnpm --filter @meitheal/web perf:budget`
- `npx pnpm --filter @meitheal/web schema:drift`
