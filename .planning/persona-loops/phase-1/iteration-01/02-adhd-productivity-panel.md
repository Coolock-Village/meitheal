# ADHD/Productivity Panel - Phase 1 Iteration 01

## Objective
Gamification + Labels Gap Analysis and Sprint Planning

| Persona | Recommendation | Impact (1-5) | Effort (1-5) | Risk (1-5) | Decision |
| --- | --- | --- | --- | --- | --- |
| Workflow Coach | Extract `LabelBadges.astro` and `LabelPicker.astro` as the FIRST task before any page integration — creates a self-contained vertical slice that can be tested in isolation, reducing context-switching cost when integrating across 4+ pages | 4 | 2 | 1 | Accept |
| Execution Coach | Add a `labels:render` E2E test that verifies label badges appear on kanban cards (screenshot comparison) BEFORE extracting the component — establishes a regression baseline so the extraction can't silently break rendering | 5 | 2 | 1 | Accept |
| Knowledge Coach | Add KCS inline comments in `LabelPicker.astro` explaining the autocomplete data flow: fetch → filter → select → emit — so future-me and contributors understand the component's contract without reading the API | 3 | 1 | 1 | Accept |
| Focus Optimizer | Phase 1 scope is exactly right — 5 requirements, all label component extraction + rendering. Do NOT let gamification concerns bleed into Phase 1. Gamification domain definition happens in Phase 4 | 4 | 1 | 1 | Accept |
| Automation Coach | Create a `label-color-resolver.ts` utility that maps label names → hex colors (checking Vikunja compat store first, falling back to a deterministic hash-based palette) — eliminates the repeated inline color lookup in every view | 4 | 2 | 1 | Accept |

## Rejected or Deferred

- (none)
