# WebMCP + A2A Agent Protocol Setup

**KCS Article** — How to enable and use agent protocols in Meitheal.

## What Are Agent Protocols?

Meitheal supports three complementary protocols that let AI agents interact with your task management system:

| Protocol | Purpose | Status |
| --- | --- | --- |
| **A2A** | Agent-to-agent communication | Stable (RC v1.0) |
| **WebMCP** | Browser agent tool access | Experimental |
| **MCP** | Tool discovery for AI clients | Stable |

## Enabling Agent Protocols

1. Navigate to **Settings** → scroll to **🔗 Agent Protocols**
2. Toggle the protocols you want to enable:
   - **A2A** — Serves an Agent Card so other AI agents can discover Meitheal
   - **WebMCP** — Registers tools with your browser's AI assistant (Chrome only)
   - **MCP** — Serves tool definitions for MCP-compatible clients
3. Click **Save Agent Protocol Settings**

## Testing A2A

Send a test message to the A2A endpoint:

```bash
curl -X POST http://localhost:4321/api/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "role": "user",
      "messageId": "test-001",
      "parts": [{
        "text": "Create a task titled Test from A2A",
        "data": { "skill": "task-management" }
      }]
    }
  }'
```

## Viewing the Agent Card

Visit `http://localhost:4321/api/a2a/agent-card` to see the dynamic Agent Card.

The static fallback is at `http://localhost:4321/.well-known/agent-card.json`.

## Available Skills

| Skill | Description | Requires HA |
| --- | --- | --- |
| `task-management` | CRUD tasks | No |
| `task-search` | Search/filter tasks | No |
| `framework-scoring` | RICE/HEART/KCS scoring | No |
| `data-export` | Export JSON/CSV | No |
| `ha-calendar-sync` | Sync to HA calendar | Yes |
| `ha-entity-state` | Read HA entities | Yes |

## Security Notes

- A2A endpoints validate message structure before processing
- WebMCP tools call through existing authenticated API routes
- Webhook notifications use existing HMAC signing infrastructure
- No new network dependencies are introduced

## References

- [A2A Protocol Specification](https://a2a-protocol.org/latest/)
- [WebMCP Chrome EPP](https://developer.chrome.com/blog/webmcp-epp)
- [MCP Documentation](https://modelcontextprotocol.io/)
