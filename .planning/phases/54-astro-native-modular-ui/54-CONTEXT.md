# Phase 54: Astro Native Modular UI & Settings Alignment

## Context

Following the GSD autonomous directive and the project roadmap (Phases 34, 35, 38).

Meitheal's UX has evolved significantly, adding new integrations, modals, and views. As we scale, the UI needs to remain extremely fast, maintainable, and customizable. Currently, some logic is tightly coupled inside large Astro pages (e.g., `settings.astro`), and the navigation structure is functional but could be more modular.

Furthermore, we need to ensure that a user's customized UI preferences (such as the sidebar order and visibility configuration) are fully captured in our data export and restored correctly during import.

## Goals

1. **Astro Native Extraction:** Extract reusable UI blocks (modals, complex settings tabs) into standalone `.astro` components.
2. **Modular Navigation:** Refactor `Sidebar.astro` and `TopNavigation.astro` to be fully extensible.
3. **Settings Export Alignment:** Ensure `sidebar_config` and UI preferences are serialized in the settings and data export APIs.

## Strategy

1. **Plan 54-01:** Address the Settings Export alignment so that any changes to the UI configuration are backed up.
2. **Plan 54-02:** Extract the complex `settings.astro` tabs into smaller, Astro-native components.
3. **Plan 54-03:** Refactor the Sidebar and Top Navigation for complete modularity.
