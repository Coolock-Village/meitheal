# Optimization Panel — Phase 6 Iteration 04

## Findings

1. **OP-604 CLI command mismatch**
- Observation: skill references `gsd progress`, but current CLI does not provide that command.
- Impact: low-to-medium operator confusion during resume/start steps.
- Recommendation: document supported alternatives (`gsd doctor`, `gsd workflows`, `gsd open <workflow>`, `gsd-tools init progress`).

2. **OP-605 Phase status interpretation clarity**
- Observation: heuristic `in_progress` vs canonical `planned` for draft plans can confuse handoffs.
- Impact: low; already mitigated in planning contract.
- Recommendation: keep this caveat in future handoff notes.
