# Phase 57: Integrations Page Iteration — Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

## Phase Boundary

Iterate on the Settings → Integrations tab to add explainer popups, smarter auto-configuration for HA-detected services, theme readability improvements, and clear differentiation between integration types. Two GSD cycles: functional improvements then UX polish.

## Implementation Decisions

### Explainer Popups
- Each integration card gets an ℹ️ info button → opens native `<dialog>` modal
- Content: what it is, what it does, how to use (3 sentences max per integration)
- HA integration: "Connected via WebSocket — consumes and provides data automatically"
- Shared `InfoModal` component pattern — reusable across tabs

### Calendar Sync
- When HA connected: dropdown of detected entities (auto-populated from `/api/ha/calendars`)
- "Custom entity…" option reveals text input for manual entry
- CaldAV preserved in collapsible "External Calendar (CalDAV)" section
- Auto-select if exactly one calendar entity exists

### Todo Sync
- Bridge explainer callout: "Bridges HA todo lists with Meitheal so automations and dashboards stay in sync"
- Update subtitle to "Bridge HA todo lists with Meitheal"

### Grocy
- Auto-detect via HA Supervisor addon list API
- Auto-populate URL from HA ingress path when detected
- Show URL/API key only for standalone or override ("Custom configuration" toggle)
- Minimal setup when connected

### n8n / Node-RED
- Split into HA Addon (auto) vs Standalone modes
- HA Addon: events via WebSocket, no config needed — detect `a0d7b954_nodered` and n8n addons
- Standalone: webhook URL + API key + secret fields
- User has n8n server + Node-RED on live HA — both should be detectable

### Webhooks
- Differentiation callout: "Webhooks are for data pipelines and automations. For AI agent protocols (A2A, MCP, WebMCP), see the Agents & AI tab."

### Theme
- Dark: bump `--text-muted`, `--text-secondary`, `--border` for WCAG AA compliance
- Light: bump `--text-muted` to `#7a7a96` for ≥4.5:1 ratio
- Maintain overall aesthetic — darker look is desired, just needs readability

## Specific Ideas

- User mentioned n8n server exists — check via MCP and HA addons API
- Node-RED is installed on live HA — verify addon slug during implementation
- Scope creep is acceptable within reason

## Testing Constraints

- Local dev at localhost:4321 for UI/CSS changes
- HA Devcontainer at localhost:7123 for ingress/WebSocket/addon testing
- ha.home.arpa only for deployed release verification
- Follow `/local-dev` workflow

## Deferred Ideas

- i18n for explainer text (future i18n phase)
- E2E test coverage for new UI components
- Badge state standardization across cards

---

*Phase: 57-integrations-iteration*
*Context gathered: 2026-03-03*
