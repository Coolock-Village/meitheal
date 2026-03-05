import type { APIRoute } from "astro";
import { apiJson, apiError } from "../../lib/api-response";

/**
 * POST /api/mcp — MCP (Model Context Protocol) Server Endpoint
 *
 * Accepts JSON-RPC 2.0 tool calls per the MCP specification.
 * Routes incoming tool requests to the Meitheal task API.
 *
 * Supports:
 * - "initialize" — handshake
 * - "tools/list" — enumerate available tools
 * - "tools/call" — execute a tool (createTask, searchTasks, completeTask, etc.)
 *
 * The handler uses the same task database as all other Meitheal endpoints.
 * Any MCP-compatible client (Claude, Antigravity, Codex) can connect here.
 *
 * @see https://modelcontextprotocol.io/
 * @see /.well-known/mcp.json for static discovery
 */

// MCP tool definitions — same as mcp_server.py but for the Astro runtime
const MCP_TOOLS = [
  {
    name: "createTask",
    description: "Create a new task with title, description, priority, labels, and due date",
    inputSchema: {
      type: "object" as const,
      required: ["title"],
      properties: {
        title: { type: "string", description: "Task title" },
        description: { type: "string", description: "Task description" },
        priority: { type: "integer", minimum: 1, maximum: 5, description: "Priority 1-5 (1=urgent)" },
        due_date: { type: "string", format: "date", description: "Due date YYYY-MM-DD" },
      },
    },
  },
  {
    name: "searchTasks",
    description: "Search tasks by keyword, status, or priority",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search keyword" },
        status: { type: "string", enum: ["todo", "in_progress", "done", "cancelled"] },
        priority: { type: "integer", minimum: 1, maximum: 5 },
      },
    },
  },
  {
    name: "completeTask",
    description: "Mark a task as done by ID or title",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Task UUID" },
        title: { type: "string", description: "Task title (fuzzy match)" },
      },
    },
  },
  {
    name: "updateTask",
    description: "Update task fields",
    inputSchema: {
      type: "object" as const,
      required: ["id"],
      properties: {
        id: { type: "string", description: "Task UUID" },
        title: { type: "string" },
        status: { type: "string", enum: ["todo", "in_progress", "done", "cancelled"] },
        priority: { type: "integer", minimum: 1, maximum: 5 },
        due_date: { type: "string", format: "date" },
        description: { type: "string" },
      },
    },
  },
  {
    name: "deleteTask",
    description: "Delete a task by ID",
    inputSchema: {
      type: "object" as const,
      required: ["id"],
      properties: {
        id: { type: "string", description: "Task UUID" },
      },
    },
  },
  {
    name: "getTask",
    description: "Get full details of a specific task by ID",
    inputSchema: {
      type: "object" as const,
      required: ["id"],
      properties: {
        id: { type: "string", description: "Task UUID" },
      },
    },
  },
];

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return apiJson(
        { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
        400
      );
    }

    const { method, id: reqId = "1", params = {} } = body as {
      method?: string;
      id?: string;
      params?: Record<string, unknown>;
    };

    // Initialize handshake
    if (method === "initialize") {
      return apiJson({
        jsonrpc: "2.0",
        id: reqId,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "meitheal", version: "0.3.0" },
        },
      });
    }

    // List tools
    if (method === "tools/list") {
      return apiJson({
        jsonrpc: "2.0",
        id: reqId,
        result: { tools: MCP_TOOLS },
      });
    }

    // Execute tool
    if (method === "tools/call") {
      const toolName = (params as { name?: string }).name ?? "";
      const args = (params as { arguments?: Record<string, unknown> }).arguments ?? {};

      const result = await executeTool(toolName, args, request);

      return apiJson({
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{ type: "text", text: JSON.stringify(result) }],
          isError: false,
        },
      });
    }

    return apiJson(
      { jsonrpc: "2.0", id: reqId, error: { code: -32601, message: `Unknown method: ${method}` } },
      400
    );
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "MCP server error",
      500
    );
  }
};

/**
 * Route MCP tool calls to internal API endpoints.
 * This keeps the MCP server thin — it delegates to the existing
 * REST API rather than reimplementing business logic.
 */
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  request: Request
): Promise<Record<string, unknown>> {
  const baseUrl = new URL(request.url).origin;

  switch (toolName) {
    case "createTask": {
      const res = await fetch(`${baseUrl}/api/tasks/create`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: args.title,
          frameworkPayload: args.description ? { description: args.description } : undefined,
          priority: args.priority,
          dueDate: args.due_date,
        }),
      });
      return { status: "created", ...(await res.json().catch(() => ({}))) };
    }

    case "searchTasks": {
      const params = new URLSearchParams();
      if (args.query) params.set("q", String(args.query));
      if (args.status) params.set("status", String(args.status));
      const res = await fetch(`${baseUrl}/api/tasks?${params}`);
      return await res.json().catch(() => ({ tasks: [] }));
    }

    case "completeTask": {
      if (args.id) {
        const res = await fetch(`${baseUrl}/api/tasks/${args.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "done" }),
        });
        return { status: "completed", ...(await res.json().catch(() => ({}))) };
      }
      // Title-based completion — search then update
      if (args.title) {
        const searchRes = await fetch(`${baseUrl}/api/tasks?q=${encodeURIComponent(String(args.title))}`);
        const data = (await searchRes.json().catch(() => ({ tasks: [] }))) as { tasks: Array<{ id: string; title: string }> };
        const match = data.tasks?.find(
          (t: { title: string }) => t.title.toLowerCase() === String(args.title).toLowerCase()
        );
        if (match) {
          await fetch(`${baseUrl}/api/tasks/${match.id}`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: "done" }),
          });
          return { status: "completed", id: match.id, title: match.title };
        }
        return { status: "not_found", title: args.title };
      }
      return { status: "error", message: "Provide id or title" };
    }

    case "updateTask": {
      const { id, ...updates } = args;
      const res = await fetch(`${baseUrl}/api/tasks/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updates),
      });
      return { status: "updated", ...(await res.json().catch(() => ({}))) };
    }

    case "deleteTask": {
      await fetch(`${baseUrl}/api/tasks/${args.id}`, { method: "DELETE" });
      return { status: "deleted", id: args.id };
    }

    case "getTask": {
      const res = await fetch(`${baseUrl}/api/tasks/${args.id}`);
      return await res.json().catch(() => ({ error: "Task not found" }));
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
