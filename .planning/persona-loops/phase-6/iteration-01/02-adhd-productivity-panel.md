# ADHD/Productivity Panel — Phase 6 Iteration 01

## Objective
Reduce cognitive load for task management, ensure fast capture, minimize context-switching friction.

| Persona | Recommendation | Impact (1-5) | Effort (1-5) | Risk (1-5) | Decision |
| --- | --- | --- | --- | --- | --- |
| Workflow Coach | Add auto-focus to the quick-add input on page load — currently users must click or press `n` first. Reduce one step from the task creation flow to match Super Productivity's instant-capture UX. | 4 | 1 | 1 | Accept |
| Execution Coach | Add task count badges to sidebar nav links (e.g., "Tasks (12)", "Active (3)") so users can see status at a glance without navigating away from their current view. | 4 | 2 | 1 | Accept |
| Knowledge Coach | Add inline help tooltips on RICE scoring fields explaining each factor (Reach = # users affected per quarter, Impact = 3/2/1/0.5/0.25, Confidence = 100%/80%/50%, Effort = person-months). The current form has labels but no context. | 4 | 1 | 1 | Accept |
| Focus Optimizer | Persist selected view (list/kanban/table) and active filters in localStorage so returning users land exactly where they left off — currently every page load resets to default. | 4 | 2 | 1 | Accept |
| Automation Coach | Add a toast notification when tasks are created via API (webhook/voice) so the user is aware of external task additions. Currently only UI-created tasks show toasts. | 3 | 2 | 1 | Accept |

## Capture/Triage/Follow-through Improvement

- View persistence (filter state + selected view) eliminates re-navigation on every visit.
- Sidebar badges provide constant awareness of task pipeline status.
