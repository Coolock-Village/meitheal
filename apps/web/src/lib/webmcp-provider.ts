/**
 * WebMCP Provider — Browser Agent Tool Registration
 *
 * Registers Meitheal domain tools with the browser's WebMCP API
 * (navigator.ai.createModelContextProvider) for Chrome EPP.
 *
 * Feature-detected: gracefully no-ops on unsupported browsers.
 * Gated: only registers tools when WebMCP is enabled in Settings.
 *
 * Domain: web (client-side)
 * KCS: See WEBMCP.md for protocol documentation.
 * Spec: https://developer.chrome.com/blog/webmcp-epp
 */

/** Check if the WebMCP API is available in this browser. */
export function isWebMCPSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "ai" in navigator &&
    typeof (navigator as NavigatorWithAI).ai?.createModelContextProvider ===
      "function"
  );
}

/** Navigator extension for WebMCP API. */
interface NavigatorWithAI extends Navigator {
  ai?: {
    createModelContextProvider?: (config: WebMCPProviderConfig) => void;
  };
}

/** WebMCP tool definition. */
interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

/** WebMCP provider configuration. */
interface WebMCPProviderConfig {
  name: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    handler: (input: Record<string, unknown>) => Promise<unknown>;
  }>;
}

/**
 * Define Meitheal's WebMCP tools.
 * Each tool maps to an existing API endpoint or UI action.
 */
function getMeithealTools(): WebMCPTool[] {
  return [
    {
      name: "createTask",
      description:
        "Create a new task in Meitheal with a title, optional description, priority (1-5), labels, and due date. Returns the created task with its ID.",
      inputSchema: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", description: "Task title" },
          description: {
            type: "string",
            description: "Task description (plain text or HTML)",
          },
          priority: {
            type: "integer",
            minimum: 1,
            maximum: 5,
            description: "Priority level: 1=critical, 5=low",
          },
          labels: {
            type: "array",
            items: { type: "string" },
            description: "Label names to apply",
          },
          due_date: {
            type: "string",
            format: "date",
            description: "Due date in YYYY-MM-DD format",
          },
        },
      },
      handler: async (input) => {
        const res = await fetch((window.__ingress_path || "") + "/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        return res.json();
      },
    },
    {
      name: "searchTasks",
      description:
        "Search and filter tasks by free text query, status, priority, or labels. Returns an array of matching tasks.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free text search" },
          status: {
            type: "string",
            enum: ["backlog", "todo", "in_progress", "done", "cancelled"],
          },
          priority: {
            type: "integer",
            minimum: 1,
            maximum: 5,
            description: "Filter by minimum priority",
          },
        },
      },
      handler: async (input) => {
        const params = new URLSearchParams();
        if (input.query) params.set("q", String(input.query));
        if (input.status) params.set("status", String(input.status));
        const res = await fetch(`${window.__ingress_path || ""}/api/tasks?${params.toString()}`);
        return res.json();
      },
    },
    {
      name: "getTaskDetails",
      description:
        "Get the full details of a specific task by its ID, including description, labels, comments, and activity history.",
      inputSchema: {
        type: "object",
        required: ["taskId"],
        properties: {
          taskId: {
            type: "integer",
            description: "The Meitheal task ID",
          },
        },
      },
      handler: async (input) => {
        const res = await fetch(`${window.__ingress_path || ""}/api/tasks/${input.taskId}`);
        return res.json();
      },
    },
    {
      name: "updateTaskStatus",
      description:
        "Change the status of an existing task. Valid statuses: todo, in_progress, done, cancelled.",
      inputSchema: {
        type: "object",
        required: ["taskId", "status"],
        properties: {
          taskId: { type: "integer", description: "Task ID to update" },
          status: {
            type: "string",
            enum: ["backlog", "todo", "in_progress", "done", "cancelled"],
            description: "New status",
          },
        },
      },
      handler: async (input) => {
        const res = await fetch(`${window.__ingress_path || ""}/api/tasks/${input.taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: input.status }),
        });
        return res.json();
      },
    },
    {
      name: "navigateToBoard",
      description:
        "Navigate the Meitheal UI to a specific board view. Options: kanban, table, list, calendar, today, upcoming.",
      inputSchema: {
        type: "object",
        required: ["view"],
        properties: {
          view: {
            type: "string",
            enum: [
              "kanban",
              "table",
              "tasks",
              "calendar",
              "today",
              "upcoming",
            ],
            description: "The board view to navigate to",
          },
        },
      },
      handler: async (input) => {
        const viewMap: Record<string, string> = {
          kanban: "/kanban",
          table: "/table",
          tasks: "/tasks",
          calendar: "/calendar",
          today: "/today",
          upcoming: "/upcoming",
        };
        const path = viewMap[String(input.view)] ?? "/";
        window.location.href = (window.__ingress_path || "") + path;
        return { success: true, navigatedTo: path };
      },
    },
    {
      name: "exportTasks",
      description:
        "Export all tasks in JSON or CSV format. Returns a download URL.",
      inputSchema: {
        type: "object",
        properties: {
          format: {
            type: "string",
            enum: ["json", "csv"],
            default: "json",
            description: "Export format",
          },
        },
      },
      handler: async (input) => {
        const format = String(input.format ?? "json");
        const endpoint =
          format === "csv"
            ? "/api/export/tasks.csv"
            : "/api/export/tasks.json";
        const res = await fetch((window.__ingress_path || "") + endpoint);
        return res.json();
      },
    },
    {
      name: "linkTask",
      description:
        "Create a Jira-style link between two tasks. Link types: related_to, blocked_by, blocks, duplicates, duplicated_by.",
      inputSchema: {
        type: "object",
        required: ["source_task_id", "target_task_id", "link_type"],
        properties: {
          source_task_id: { type: "string", description: "Source task UUID" },
          target_task_id: { type: "string", description: "Target task UUID" },
          link_type: {
            type: "string",
            enum: ["related_to", "blocked_by", "blocks", "duplicates", "duplicated_by"],
            description: "Relationship type",
          },
        },
      },
      handler: async (input) => {
        const res = await fetch(
          `${window.__ingress_path || ""}/api/tasks/${input.source_task_id}/links`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target_task_id: input.target_task_id, link_type: input.link_type }),
          },
        );
        return res.json();
      },
    },
    {
      name: "unlinkTask",
      description: "Remove a link between two tasks by link ID.",
      inputSchema: {
        type: "object",
        required: ["task_id", "link_id"],
        properties: {
          task_id: { type: "string", description: "Task UUID the link belongs to" },
          link_id: { type: "string", description: "Link UUID to remove" },
        },
      },
      handler: async (input) => {
        const res = await fetch(
          `${window.__ingress_path || ""}/api/tasks/${input.task_id}/links?link_id=${encodeURIComponent(String(input.link_id))}`,
          { method: "DELETE" },
        );
        return res.json();
      },
    },
    {
      name: "getTaskLinks",
      description: "Get all outbound and inbound links for a task.",
      inputSchema: {
        type: "object",
        required: ["task_id"],
        properties: {
          task_id: { type: "string", description: "Task UUID" },
        },
      },
      handler: async (input) => {
        const res = await fetch(
          `${window.__ingress_path || ""}/api/tasks/${input.task_id}/links`,
        );
        return res.json();
      },
    },
  ];
}

/**
 * Initialize the WebMCP provider.
 * Call this on page load — it feature-detects and gracefully no-ops.
 *
 * @param enabled - Whether WebMCP is enabled in settings (checked before calling)
 */
export function initWebMCPProvider(enabled: boolean = true): boolean {
  if (!enabled) {
    console.info("[WebMCP] Disabled in settings — skipping registration");
    return false;
  }

  if (!isWebMCPSupported()) {
    console.info(
      "[WebMCP] Browser does not support navigator.ai — skipping registration"
    );
    return false;
  }

  try {
    const nav = navigator as NavigatorWithAI;
    const tools = getMeithealTools();

    nav.ai!.createModelContextProvider!({
      name: "meitheal",
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        handler: t.handler,
      })),
    });

    console.info(
      `[WebMCP] Registered ${tools.length} tools: ${tools.map((t) => t.name).join(", ")}`
    );
    return true;
  } catch (error) {
    console.warn("[WebMCP] Failed to register provider:", error);
    return false;
  }
}
