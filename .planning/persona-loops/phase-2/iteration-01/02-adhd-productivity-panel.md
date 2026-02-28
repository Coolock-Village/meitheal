# ADHD & Productivity Panel — Phase 2 Iteration 01

## Panel Members

| Persona | Domain | Focus |
|---------|--------|-------|
| Focus Optimizer | ADHD task management | Context switching, task chunking, flow state |
| Knowledge Coach | KCS/documentation | Just-in-time docs, runbook structure, searchability |
| Execution Coach | Delivery velocity | Parallelization, dependency minimization, quick wins |
| Automation Specialist | CI/CD, testing | Feedback loops, regression prevention, confidence |

## Recommendations

| ID | Persona | Recommendation | Impact | Effort | Risk | Score |
|----|---------|----------------|--------|--------|------|-------|
| AD-201 | Focus Optimizer | Wave 1 plans (01, 02) are independent — execute in parallel to halve elapsed time. Security hardening has zero dependency on webhook emission. | 4 | 0 | 1 | 5 |
| AD-202 | Knowledge Coach | Webhook setup guide (T-232) should include a "Quick Start" section — 5 steps to first webhook delivery. ADHD users scan for the shortest path. | 4 | 1 | 1 | 6 |
| AD-203 | Knowledge Coach | Add webhook event catalog as structured YAML (not just prose) — enables future UI auto-generation of webhook config forms. | 3 | 2 | 1 | 6 |
| AD-204 | Execution Coach | T-206 tests can be written TDD-first — signer and emitter have pure function signatures that are trivially testable before implementation. | 4 | 1 | 1 | 6 |
| AD-205 | Execution Coach | Ship Plan 02 (security hardening) as a standalone PR — it closes tracked concerns and is independently valuable even if webhook work is incomplete. | 4 | 1 | 1 | 6 |
| AD-206 | Automation Specialist | Add webhook delivery test to CI pipeline — mock subscriber endpoint in test harness, verify round-trip sign → deliver → verify. | 4 | 2 | 2 | 8 |
| AD-207 | Automation Specialist | Add Grocy adapter to `ha-harness` CI job — compat test should include stock check flow if Grocy env vars are configured. | 3 | 2 | 2 | 7 |
| AD-208 | Focus Optimizer | KCS docs (Plan 04) are low-cognitive-load tasks — schedule after code plans when energy is lower. Good context-switch recovery work. | 3 | 0 | 0 | 3 |
