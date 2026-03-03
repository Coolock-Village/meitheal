# Phase 54: Settings & Integrations UX — Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

## Phase Boundary

This phase delivers a complete overhaul of the Settings General tab and Integrations tab UX, addressing 25 findings from a 50-persona panel review. The core deliverable is making HA native features intuitive, eliminating redundant manual configuration, and creating clear visual separation between integrations with inline documentation.

**Scope anchor:** Settings page UX only (General + Integrations tabs). Does not include new integrations — only improves existing ones.

## Implementation Decisions

### HA Connection (General Tab)
- Replace manual HA URL / Long-Lived Token form with **auto-detect status card**
- Show connection mode (addon vs standalone), HA version, location, timezone
- Manual fields only visible in collapsed "Advanced / Standalone Mode" section
- Remove Calendar Entity from General tab — it belongs exclusively in Integrations

### Entity Selection
- Replace all HA entity text inputs with `<select>` dropdowns
- Populated via existing WebSocket auto-detection (`/api/ha/calendars`, `/api/todo`)
- Include "Enter custom entity ID" fallback option in each dropdown
- Auto-select if only one entity is detected

### Integrations Tab Layout
- Split single card into **individual collapsible integration cards**
- Each card: icon + name + status badge in header, config form on expand
- Collapsed by default unless already configured
- Standardized badge taxonomy: `Connected` / `Configured` / `Not configured` / `Error`

### Inline Documentation
- `(?)` help tooltip buttons next to key labels throughout settings
- Popover with explanation text, optional link to HA docs
- ARIA accessible (role="tooltip", keyboard dismiss)

### Code Architecture
- Extract 1972-line `settings.astro` JS into domain-specific modules
- `settings-integrations.ts`, `settings-general.ts`, `settings-system.ts`
- Shared components: `HelpTooltip.astro`, `EntitySelector.astro`

### Consistency
- Todo Sync toggle → use custom toggle switch (`.toggle-label`) instead of raw checkbox
- All save handlers → auto-test on save where applicable
- Loading skeletons during async entity detection

### Agent's Discretion
- Exact tooltip copy and help text content
- Animation easing and timing for collapsible cards
- Visual ordering of integrations within the tab

## Specific Ideas

- User circled the HA URL/Token section in screenshot and said "this shouldn't be necessary"
- User noted integrations page "doesn't create great lines of separation"
- User noted lack of "built-in pop up documentation or tooltips"
- 10 UX/UI optimisation cycles required after implementation

## Deferred Ideas

- Search/filter for integrations (premature with only 5 integrations)
- CalDAV connection test button (needs server-side CalDAV client)
- "Last synced" timestamp display (needs sync history tracking)
- Breadcrumbs for settings sub-navigation (low priority now)

---

*Phase: 54-settings-integrations-ux*
*Context gathered: 2026-03-03*
