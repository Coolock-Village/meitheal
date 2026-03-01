# 51-Persona Cross-Phase Audit — Vikunja UI/UX Parity

**Date:** 2026-03-01
**Scope:** UI/UX Comparison between Meitheal (Phase 21-30) and Vikunja (Reference Benchmark)
**Objective:** Exceed Vikunja's UI/UX baseline while maintaining our specialized PM features (RICE, HEART, DDD).

## Context

Vikunja is our primary open-source competitor in the self-hosted task management space. While we have achieved API compatibility (for voice assistants) and raw feature parity in many areas, a direct browser-based audit reveals significant UX/UI gaps. Vikunja feels spacious, consumer-grade, and highly interactive. Meitheal feels dense, heavily functional, and slightly cramped.

## Audit Matrix

| # | Persona | Domain | Finding (Gap vs Vikunja) | Severity | Action |
|---|---------|--------|--------------------------|----------|--------|
| 1 | UX Designer | Information Density | Meitheal's task detail slide-out feels cramped compared to Vikunja's right-side metadata panel. Need more whitespace and better typography hierarchy. | ⚠️ High | Phase 31 |
| 2 | Product Manager | View Flexibility | Vikunja allows instant switching between List, Kanban, Table, and Gantt without losing project context. Meitheal requires sidebar navigation. | ⚠️ High | Phase 31 |
| 3 | Project Manager | Timeline/Gantt | Vikunja has a first-class Gantt/Timeline view. Meitheal lacks this completely (critical for long-term planning). | 🔴 Critical| Phase 31 |
| 4 | Power User | Interactions | Vikunja uses a rich-text editor (Tiptap) for descriptions. Meitheal uses a standard markdown textarea. | ⚠️ Med | Phase 31 |
| 5 | UI Polish | Components | Vikunja's padding, shadows, and component alignment are strictly governed by a design system. Meitheal has minor inconsistencies in spacing and border-radii. | ℹ️ Low | Phase 31 |
| 6 | New User | Information Arch | Vikunja uses a strict Project/Bucket hierarchy in the sidebar. Meitheal relies heavily on Views/Filters. | ℹ️ Low | Acceptable (DDD) |
| 7 | Accessibility Analyst | Contrast/Space | Vikunja's default light mode is highly legible. Meitheal's dark-mode density can cause eye strain; needs a "breathing room" CSS pass. | ⚠️ Med | Phase 31 |

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 Critical| 1 | Define Phase 31 (Gantt/Timeline View) |
| ⚠️ High | 2 | Refine Task Detail UX, Add View Switcher Tabs |
| ⚠️ Med | 2 | CSS Polish, Evaluate Rich Text Editor |
| ℹ️ Low | 2 | Post-Phase 31 backlog |

## Immediate Action Plan (Phase 31: UX Ascendancy)

To exceed Vikunja, we must execute the following as **Phase 31**:

1. **The "Breathing Room" Pass (P0)**:
   - Refactor `TaskDetailPanel` padding, typography (`text-sm` vs `text-base`), and divider usage.
   - Implement a right-side metadata column approach on wider screens within the slide-out, moving away from a single, vertically scrolling list.

2. **Contextual View Switcher (P0)**:
   - Introduce a tabbed interface at the top of the main task view (e.g., `ViewsTabs.tsx`).
   - Allow users to toggle between `List | Board | Table | Gantt` while maintaining the current filter/search context.

3. **Gantt / Timeline View Implementation (P1)**:
   - Create a specialized `GanttView.astro`/`GanttView.tsx` component.
   - Map task `start_date` and `due_date` to a timeline grid.

4. **Rich Text Description Upgrade (P2)**:
   - Replace the standard description `textarea` with a lightweight block/rich-text editor, or significantly enhance the markdown preview interaction to feel seamless.

## Our Advantages (To Retain & Highlight)

While fixing the gaps, we must ensure these features remain prominent, as Vikunja lacks them:
- **Scoring Frameworks**: First-class support for RICE, HEART, ICE in the UI.
- **DDD Concepts**: Epics vs Stories vs Tasks categorization.
- **Home Assistant Native**: Tight integration with the HA ecosystem (Calendars, Webhooks).
- **Dashboard Quick-Add**: Our dashboard is significantly faster for raw brain-dumps than Vikunja's overview.
