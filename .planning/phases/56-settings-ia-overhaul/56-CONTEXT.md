# Phase 56: Settings IA Overhaul - Context

**Gathered:** 2026-03-03
**Status:** Ready for execution (partially started)

<domain>
## Phase Boundary

Restructure the Settings page information architecture to fix card ordering, tab assignments, and UX readability. Adds in-app Help & Support section. Does NOT add new features or settings — purely IA and presentation.

</domain>

<decisions>
## Implementation Decisions

### Tab Assignment
- HA Connection → Integrations (first card, accordion style matching Calendar/Todo/etc)
- PWA Status → System > About card (compact single line, not full card)
- Sidebar Config → first item in General tab

### General Tab Content (in order)
1. Sidebar Configuration (visibility, ordering, custom links)
2. Custom Fields
3. Strategic Lenses

### Test Connection UX
- Cap component list at 5 items with "Show all X" expand
- Use `var(--text-secondary)` for text, not `var(--text-primary)`
- Add line spacing between components

### Help & Support
- New section in System tab (before Danger Zone)
- Inline rendered README content (project description, links, version)
- Links to: GitHub Issues, Discussions, Star

### Claude's Discretion
- Exact accordion expand behavior for HA card
- Compact PWA line format in About card

</decisions>

<specifics>
## Specific Ideas

- User explicitly said: "PWA box should NOT be that prominent"
- User explicitly said: "Custom Items and sidebar config should come first"
- User explicitly said: "Home Assistant should be under Integrations"
- User explicitly said: "Test Connection dialog is not UX friendly, needs lighter/more readable texts"
- User explicitly said: "Create a page for README in settings, so they don't have to context shift"

</specifics>

<deferred>
## Deferred Ideas

- None — all items are Settings IA scope

</deferred>

---

*Phase: 56-settings-ia-overhaul*
*Context gathered: 2026-03-03*
