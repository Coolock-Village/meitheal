# Meitheal Agent Protocol Integration

Meitheal implements three complementary agent protocols for AI interoperability:

| Protocol | Layer | Spec |
|----------|-------|------|
| **A2A** (Agent-to-Agent) | Server-side agent interop | [a2a-protocol.org](https://a2a-protocol.org/latest/) |
| **WebMCP** | Browser agent ↔ Web app | [Chrome EPP](https://developer.chrome.com/blog/webmcp-epp) |
| **MCP** (Model Context Protocol) | Static tool discovery | [modelcontextprotocol.io](https://modelcontextprotocol.io/) |

## Discovery Endpoints

| Endpoint | Protocol | Type |
|----------|----------|------|
| `/.well-known/agent-card.json` | A2A | Static Agent Card (fallback) |
| `/api/a2a/agent-card` | A2A | Dynamic Agent Card (reflects config) |
| `/.well-known/mcp.json` | MCP | Tool discovery manifest |
| `/.well-known/jsondoc.json` | OpenAPI | API documentation |
| `/llms.txt` | LLM | LLM-readable summary |

## A2A Protocol (Agent-to-Agent)

Meitheal acts as an **A2A Server** using the HTTP+JSON/REST binding (v1.0).

### Agent Card

The Agent Card describes Meitheal's capabilities and is served at two locations:

- **Static**: `/.well-known/agent-card.json` — fixed skill set
- **Dynamic**: `/api/a2a/agent-card` — skills adapt based on configured integrations (e.g., HA calendar sync only appears when HA is connected)

### Skills

| Skill ID | Description | Requires |
|----------|-------------|----------|
| `task-management` | CRUD operations on tasks | — |
| `task-search` | Search/filter tasks | — |
| `framework-scoring` | Apply RICE/HEART/KCS scoring | — |
| `data-export` | Export tasks as JSON/CSV | — |
| `ha-calendar-sync` | Sync tasks to HA calendar | HA connection |
| `ha-entity-state` | Read HA entity states | HA connection |

### API Routes

```
POST /api/a2a/message:send    — Send a message to Meitheal
GET  /api/a2a/tasks/{id}      — Get task status
POST /api/a2a/tasks/{id}:cancel — Cancel a running task
GET  /api/a2a/agent-card      — Get dynamic Agent Card
```

### Example: Send a Message

```json
POST /api/a2a/message:send
Content-Type: application/json

{
  "message": {
    "role": "user",
    "messageId": "msg-001",
    "parts": [
      {
        "text": "Create a task titled 'Deploy v2' with priority 1",
        "data": { "skill": "task-management" }
      }
    ]
  }
}
```

## WebMCP (Browser Agent Tools)

WebMCP exposes Meitheal functionality as tools for browser-native AI agents (Chrome EPP).

### Status

🧪 **Experimental** — requires Chrome with `navigator.ai` API support.

### Registered Tools

When WebMCP is enabled in Settings, the following tools are registered:

| Tool | Description |
|------|-------------|
| `createTask` | Create a new task |
| `searchTasks` | Search/filter tasks |
| `navigateToBoard` | Switch board views |
| `getTaskDetails` | Get full task detail |
| `updateTaskStatus` | Change task status |
| `askAI` | Trigger AI analysis |

### How It Works

The WebMCP provider (`src/lib/webmcp-provider.ts`) registers tools using the browser's `navigator.ai.createModelContextProvider()` API. Tools are lazy-loaded and only registered if:

1. The browser supports the API (feature detection)
2. WebMCP is enabled in Settings
3. The user is on a page where the tools are relevant

## MCP Discovery

The static `/.well-known/mcp.json` provides tool schemas for MCP-compatible clients. It includes JSON Schema definitions for all tools and cross-references the A2A Agent Card.

## Settings

All three protocols are configurable in **Settings → 🤖 Agent Protocols**:

- **A2A**: Enable/disable the agent card and message endpoint
- **WebMCP**: Enable/disable browser tool registration
- **MCP**: Enable/disable MCP discovery

## Design Rules

1. **Zero new dependencies** — A2A uses native `fetch`, WebMCP is a browser API
2. **HA-first** — HA skills only appear when HA connection is configured
3. **Graceful degradation** — WebMCP no-ops on unsupported browsers
4. **Security** — All endpoints validate input; webhooks use existing HMAC signing
5. **Domain events** — A2A interactions emit events for n8n/webhook subscribers
