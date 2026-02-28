# ADHD/Productivity Panel — Phase 7 Iteration 01

## Objective
Identify remaining cognitive load, workflow friction, and UX issues in the Phase 6 UI.

| Persona | Recommendation | Impact | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Workflow Coach | Add empty state CTAs with direct action buttons — "No tasks yet" should have a prominent "Create your first task" button, not just text. Reduces barrier to first action. | 4 | 1 | 1 | Accept |
| Execution Coach | Add task count to page title (browser tab) so users can see pipeline status without switching tabs. e.g. "Tasks (12) — Meitheal" | 3 | 1 | 1 | Accept |
| Knowledge Coach | Add onboarding hint on first visit — "Press ? for keyboard shortcuts" shown once via localStorage flag. Currently users don't discover shortcuts organically. | 3 | 2 | 1 | Accept |
| Focus Optimizer | Add transition animation when switching between views (list → kanban → table) to provide visual continuity. Currently views hard-refresh which is disorienting. | 2 | 2 | 1 | Defer |
| Automation Coach | Add a page-level loading skeleton for SSR pages — currently pages flash empty then populate. A skeleton loader would prevent layout shift. | 4 | 2 | 1 | Accept |
