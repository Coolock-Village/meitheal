# Phase 31: WebMCP + A2A Agent Interoperability — Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 31 makes Meitheal **agent-ready** across three complementary protocols:

| Protocol | Layer | What it does | Discovery |
|----------|-------|-------------|-----------|
| **WebMCP** | Browser agent ↔ Web app | JS API exposing tools to browser agents (Chrome EPP) | In-page registration |
| **A2A** | Agent ↔ Agent | HTTP+JSON protocol for agent interoperability (Google/Linux Foundation) | `/.well-known/agent-card.json` |
| **MCP** | Agent ↔ Tools | Existing static discovery (already have `mcp.json`) | `/.well-known/mcp.json` |

This phase delivers:
1. A2A Agent Card with Meitheal skills (task CRUD, calendar sync, framework scoring)
2. A2A HTTP+JSON REST endpoint for agent-to-agent task delegation
3. WebMCP JS provider registering tools for browser agents
4. Settings panel section for agent protocol configuration
5. Enhanced `mcp.json` discovery manifest
6. E2E tests validating all discovery and tool invocation paths

**Out of scope:** Full A2A streaming/SSE, gRPC binding, autonomous agent workflows, MCP server (backend).

</domain>

<decisions>
## Implementation Decisions

### Protocol Strategy
- A2A uses **HTTP+JSON/REST** binding (not JSON-RPC or gRPC) — fits Astro SSR naturally
- WebMCP uses **imperative JS API** — feature-detected, graceful fallback for non-Chrome browsers
- Existing `mcp.json` upgraded to include tool schemas but kept as static discovery
- A2A Agent Card served at `/.well-known/agent-card.json` per spec

### Home Assistant First/Native
- HA-specific skills exposed via A2A: `ha.calendar-sync`, `ha.entity-state`, `ha.automation-trigger`
- WebMCP tools gated behind HA connection status (only register HA tools when connected)
- A2A push notifications bridge to existing webhook emitter infrastructure
- Agent Card dynamically generated from configured integrations (not static file)

### Astro Optimized
- A2A endpoint as Astro API route (`/api/a2a/[...path].ts`)
- Agent Card generated server-side from settings DB (dynamic, reflects configured integrations)
- WebMCP provider loaded as client-side module — tree-shaken, lazy-loaded
- No new npm dependencies for A2A (HTTP+JSON is native fetch), WebMCP is browser-native

### n8n/Webhook Strategy Integration
- A2A push notifications route through existing `webhook-emitter.ts` infrastructure
- Agent-initiated tasks emit domain events → existing n8n webhooks fire
- New A2A skill: `webhook.configure` — lets agents manage webhook subscriptions
- Bidirectional: external agents can POST tasks to Meitheal via A2A, Meitheal webhooks notify them of completion

### UX — Settings Panel
- New "🤖 Agent Protocols" integration section in Settings (full-width card like existing Integrations)
- Three sub-sections: A2A, WebMCP, MCP — each with enable/disable toggle
- A2A: toggle + Agent Card preview (live JSON) + skill checklist
- WebMCP: toggle + per-tool granular enable/disable + connected agents indicator
- MCP: toggle + link to `/.well-known/mcp.json` from the existing section
- Status badges (Active/Disabled) matching existing integration section design
- Settings persisted via existing `api/settings` key-value store
- **No blue dot** — section fully wired to persistence, tested, and matches existing card style

### Claude's Discretion
- Internal tool naming conventions (e.g., `meitheal.task.create` vs `create-task`)
- A2A Agent Card description and skill examples wording
- WebMCP tool description verbosity (natural language for LLMs)
- Order of tools in WebMCP registration

</decisions>

<specifics>
## Specific Ideas

### A2A Skills (mapped from existing API routes)
1. `task-management` — CRUD tasks (maps to existing `/api/tasks`)
2. `task-search` — Search/filter tasks by status, priority, labels
3. `calendar-sync` — Trigger HA calendar sync (maps to `/api/ha/calendar`)
4. `framework-scoring` — Apply RICE/HEART/KCS scoring to tasks
5. `data-export` — Export tasks as JSON/CSV
6. `webhook-configure` — Add/remove webhook subscribers

### WebMCP Tools (client-side, maps to existing UI actions)
1. `createTask(title, description, priority, labels)` — create a new task
2. `searchTasks(query, filters)` — search and filter tasks
3. `navigateToBoard(boardId)` — switch between Kanban/Table/List views
4. `getTaskDetails(taskId)` — get full task detail
5. `updateTaskStatus(taskId, status)` — change task status (todo/in_progress/done)
6. `askAI(taskId)` — trigger AI analysis for a task

### References
- WebMCP Chrome EPP: https://developer.chrome.com/blog/webmcp-epp
- WebMCP GitHub: https://github.com/webmachinelearning/webmcp
- A2A Protocol: https://a2a-protocol.org/latest/
- A2A JS SDK: https://github.com/a2aproject/a2a-js
- Existing webhook infra: `packages/integration-core/src/webhook-emitter.ts`
- Existing mcp.json: `public/.well-known/mcp.json`

</specifics>

<deferred>
## Deferred Ideas

- Full MCP server (backend, Python/Node) — separate phase, WebMCP covers browser-side
- A2A gRPC binding — enterprise use case, not needed for HA deployment
- A2A streaming/SSE — complexity vs. value for task management
- Agent Card signing (JWS) — requires key management infrastructure
- A2A multi-tenant support — single-user HA deployment
- Background model context providers (Service Worker WebMCP) — per spec "future exploration"
- A2A agent registry/catalog discovery — beyond single-instance scope

</deferred>

---

*Phase: 31-webmcp-a2a*
*Context gathered: 2026-03-01*
