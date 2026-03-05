"""Meitheal MCP (Model Context Protocol) server endpoint.

Exposes Meitheal's task management as a live MCP server, allowing
any MCP-compatible agent (Claude, Antigravity, Codex, etc.) to
create, search, complete, and manage tasks programmatically.

Endpoint: POST /api/mcp
Discovery: GET /.well-known/mcp.json (already exists as static file)

The MCP spec is tool-based: client sends a tool call, server executes
and returns the result. This module processes incoming tool calls and
routes them to the coordinator.

@see https://modelcontextprotocol.io/
"""

from __future__ import annotations

import json
import logging
from typing import Any

from .coordinator import MeithealCoordinator

_LOGGER = logging.getLogger(__name__)

# MCP tool definitions that match the static /.well-known/mcp.json
MCP_TOOLS = {
    "createTask": {
        "description": "Create a new task with title, description, priority, labels, and due date",
        "required": ["title"],
    },
    "searchTasks": {
        "description": "Search and filter tasks by status, priority, labels, or free text query",
        "required": [],
    },
    "completeTask": {
        "description": "Mark a task as done by ID or title",
        "required": [],
    },
    "updateTask": {
        "description": "Update task fields (title, status, priority, due_date, description)",
        "required": ["id"],
    },
    "deleteTask": {
        "description": "Delete a task by ID",
        "required": ["id"],
    },
    "getTask": {
        "description": "Get full details of a specific task",
        "required": ["id"],
    },
    "listTools": {
        "description": "List available MCP tools",
        "required": [],
    },
}


async def handle_mcp_request(
    coordinator: MeithealCoordinator,
    request_body: dict[str, Any],
) -> dict[str, Any]:
    """Process an MCP tool call request.

    Expected request format:
    {
        "jsonrpc": "2.0",
        "id": "req-1",
        "method": "tools/call",
        "params": {
            "name": "createTask",
            "arguments": { "title": "Buy groceries" }
        }
    }

    Also supports:
    - "tools/list" — list available tools
    - "initialize" — handshake
    """
    method = request_body.get("method", "")
    req_id = request_body.get("id", "1")
    params = request_body.get("params", {})

    # Handshake
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {"listChanged": False}},
                "serverInfo": {
                    "name": "meitheal",
                    "version": "0.3.0",
                },
            },
        }

    # List tools
    if method == "tools/list":
        tools_list = []
        for name, meta in MCP_TOOLS.items():
            tools_list.append({
                "name": name,
                "description": meta["description"],
                "inputSchema": {
                    "type": "object",
                    "required": meta["required"],
                },
            })
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tools": tools_list},
        }

    # Execute tool
    if method == "tools/call":
        tool_name = params.get("name", "")
        arguments = params.get("arguments", {})

        try:
            result = await _execute_tool(coordinator, tool_name, arguments)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps(result)}],
                    "isError": False,
                },
            }
        except Exception as err:
            _LOGGER.error("MCP tool %s failed: %s", tool_name, err)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": str(err)}],
                    "isError": True,
                },
            }

    # Unknown method
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Unknown method: {method}"},
    }


async def _execute_tool(
    coordinator: MeithealCoordinator,
    tool_name: str,
    args: dict[str, Any],
) -> Any:
    """Execute an MCP tool and return the result."""

    if tool_name == "createTask":
        await coordinator.async_create_task(
            title=args["title"],
            description=args.get("description"),
        )
        return {"status": "created", "title": args["title"]}

    elif tool_name == "completeTask":
        await coordinator.async_complete_task(
            task_id=args.get("id"),
            title=args.get("title"),
        )
        return {"status": "completed"}

    elif tool_name == "deleteTask":
        await coordinator.async_delete_task(task_id=args["id"])
        return {"status": "deleted"}

    elif tool_name == "updateTask":
        task_id = args.pop("id")
        await coordinator.async_update_task(task_id, args)
        return {"status": "updated", "id": task_id}

    elif tool_name == "searchTasks":
        if not coordinator.data:
            return {"tasks": []}
        query = args.get("query", "").lower()
        status = args.get("status")
        results = []
        for t in coordinator.data.tasks:
            if status and t.status != status:
                continue
            if query and query not in t.title.lower() and (
                not t.description or query not in t.description.lower()
            ):
                continue
            results.append({
                "id": t.id, "title": t.title, "status": t.status,
                "priority": t.priority, "due_date": t.due_date,
            })
        return {"tasks": results}

    elif tool_name == "getTask":
        if not coordinator.data:
            raise ValueError("No task data available")
        for t in coordinator.data.tasks:
            if t.id == args["id"]:
                return {
                    "id": t.id, "title": t.title, "status": t.status,
                    "priority": t.priority, "due_date": t.due_date,
                    "description": t.description, "labels": t.labels,
                    "created_at": t.created_at, "updated_at": t.updated_at,
                }
        raise ValueError(f"Task {args['id']} not found")

    elif tool_name == "listTools":
        return {"tools": list(MCP_TOOLS.keys())}

    else:
        raise ValueError(f"Unknown tool: {tool_name}")
