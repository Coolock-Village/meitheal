import { expect, test } from "@playwright/test";
import { shouldSkipBrowserSpecs } from "./_helpers";

test.skip(shouldSkipBrowserSpecs(), "Set E2E_BASE_URL to run A2A/WebMCP checks");

test.describe("A2A Agent Card Discovery", () => {
  test("agent-card.json exists at well-known path", async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(
      `${baseURL}/.well-known/agent-card.json`
    );
    expect(response.ok()).toBeTruthy();
    const card = await response.json();
    expect(card.name).toBe("Meitheal");
    expect(card.skills).toBeDefined();
    expect(Array.isArray(card.skills)).toBe(true);
    expect(card.skills.length).toBeGreaterThanOrEqual(1);
  });

  test("dynamic agent card has required fields", async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/api/a2a/agent-card`);
    expect(response.ok()).toBeTruthy();
    const card = await response.json();

    // A2A spec §4.4.1 required fields
    expect(card.name).toBeTruthy();
    expect(card.description).toBeTruthy();
    expect(card.supportedInterfaces).toBeDefined();
    expect(Array.isArray(card.supportedInterfaces)).toBe(true);
    expect(card.supportedInterfaces.length).toBeGreaterThanOrEqual(1);
    expect(card.provider).toBeDefined();
    expect(card.capabilities).toBeDefined();
    expect(card.skills).toBeDefined();
  });

  test("agent card skills have correct shape", async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/api/a2a/agent-card`);
    const card = await response.json();

    for (const skill of card.skills) {
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBeTruthy();
      expect(skill.description).toBeTruthy();
      expect(Array.isArray(skill.tags)).toBe(true);
      expect(Array.isArray(skill.examples)).toBe(true);
    }
  });

  test("agent card declares HTTP+JSON binding", async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/api/a2a/agent-card`);
    const card = await response.json();

    const httpInterface = card.supportedInterfaces.find(
      (i: Record<string, unknown>) => i.protocolBinding === "HTTP+JSON"
    );
    expect(httpInterface).toBeDefined();
    expect(httpInterface.protocolVersion).toBe("1.0");
  });
});

test.describe("A2A Message Send", () => {
  test("accepts valid message with skill", async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/a2a/message`, {
      data: {
        message: {
          role: "user",
          messageId: "test-msg-001",
          parts: [
            {
              text: "Create a task titled 'Test Task'",
              data: { skill: "task-management" },
            },
          ],
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.task).toBeDefined();
    expect(body.task.id).toBeTruthy();
    expect(body.task.status).toBe("completed");
    expect(body.task.messages.length).toBeGreaterThanOrEqual(2);
  });

  test("returns input-required when no skill detected", async ({
    request,
    baseURL,
  }) => {
    const response = await request.post(`${baseURL}/api/a2a/message`, {
      data: {
        message: {
          role: "user",
          messageId: "test-msg-002",
          parts: [{ text: "Hello, what can you do?" }],
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.task).toBeDefined();
    expect(body.task.status).toBe("input-required");
  });

  test("rejects invalid message structure", async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/a2a/message`, {
      data: { message: {} },
    });

    expect(response.status()).toBe(400);
  });

  test("rejects missing message", async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/a2a/message`, {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test("task-search skill returns response", async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/a2a/message`, {
      data: {
        message: {
          role: "user",
          messageId: "test-msg-003",
          parts: [{ text: "Search for high-priority tasks" }],
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.task.metadata?.skill).toBe("task-search");
  });

  test("framework-scoring skill returns response", async ({
    request,
    baseURL,
  }) => {
    const response = await request.post(`${baseURL}/api/a2a/message`, {
      data: {
        message: {
          role: "user",
          messageId: "test-msg-004",
          parts: [{ text: "Score this task using RICE" }],
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.task.metadata?.skill).toBe("framework-scoring");
  });
});

test.describe("A2A Task Status", () => {
  test("returns task by ID", async ({ request, baseURL }) => {
    const response = await request.get(
      `${baseURL}/api/a2a/tasks/test-task-123`
    );
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.task).toBeDefined();
    expect(body.task.id).toBe("test-task-123");
  });
});

test.describe("MCP Discovery", () => {
  test("mcp.json has tools array", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/.well-known/mcp.json`);
    expect(response.ok()).toBeTruthy();
    const mcp = await response.json();
    expect(mcp.tools).toBeDefined();
    expect(Array.isArray(mcp.tools)).toBe(true);
    expect(mcp.tools.length).toBeGreaterThanOrEqual(3);
  });

  test("mcp.json tools have input schemas", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/.well-known/mcp.json`);
    const mcp = await response.json();

    for (const tool of mcp.tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  test("mcp.json references a2a agent card", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/.well-known/mcp.json`);
    const mcp = await response.json();
    expect(mcp.agent_protocols?.a2a).toBeDefined();
    expect(mcp.agent_protocols.a2a.agent_card).toBe(
      "/.well-known/agent-card.json"
    );
  });
});
