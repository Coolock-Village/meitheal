import { test, expect } from "@playwright/test";
import * as http from "node:http";
import { createHmac } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { ensureSchema, getPersistenceClient, resetPersistenceForTests } from "../../apps/web/src/domains/tasks/persistence/store";
import { dispatchTaskEvent, resetWebhookCacheForTests } from "../../apps/web/src/lib/webhook-dispatcher";

function makeDbUrl(label: string): string {
  return `file:${path.join(os.tmpdir(), `meitheal-${label}-${Date.now()}-${Math.random()}.db`)}`;
}

test.describe("Integration Webhooks", () => {
  let mockServer: http.Server;
  let receivedRequests: { headers: Record<string, string | string[] | undefined>; body: string }[] = [];
  let port: number;

  test.beforeAll(async () => {
    mockServer = http.createServer((req, res) => {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", () => {
        receivedRequests.push({ headers: req.headers, body });
        res.writeHead(200);
        res.end("OK");
      });
    });
    await new Promise<void>(resolve => {
      mockServer.listen(0, "127.0.0.1", () => {
        port = (mockServer.address() as import("net").AddressInfo).port;
        resolve();
      });
    });
  });

  test.afterAll(async () => {
    mockServer.close();
  });

  test.beforeEach(async () => {
    process.env.MEITHEAL_DB_URL = makeDbUrl("webhooks");
    resetPersistenceForTests();
    await ensureSchema();

    // Ensure settings table exists explicitly since tasks schemas might not cover it in this slice
    const client = getPersistenceClient();
    await client.execute(
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`
    );

    receivedRequests = [];
    resetWebhookCacheForTests();
  });

  test("emits HMAC-signed webhooks on task creation", async () => {
    const secret = "test_e2e_secret_key";
    const client = getPersistenceClient();
    const now = Date.now();

    // 1. Configure the webhook settings
    await client.execute({ sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)", args: ["webhook_endpoint", `"${`http://127.0.0.1:${port}/webhook`}"`, now] });
    await client.execute({ sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)", args: ["webhook_secret", `"${secret}"`, now] });

    // 2. Dispatch event
    await dispatchTaskEvent("task.created", { id: "test-task-1", title: "Trigger Webhook Task" });

    // 3. Wait for webhook
    await expect.poll(() => receivedRequests.length).toBeGreaterThan(0);

    // 4. Verify signature and payload
    const req = receivedRequests[0]!;
    const payload = JSON.parse(req.body);

    expect(payload.eventType).toBe("task.created");
    expect(payload.payload.title).toBe("Trigger Webhook Task");
    expect(payload.payload.id).toBe("test-task-1");

    const expectedSignature = createHmac("sha256", secret).update(req.body).digest("hex");
    expect(req.headers["x-meitheal-signature"]).toBe(`sha256=${expectedSignature}`);
    expect(req.headers["x-meitheal-event"]).toBe("task.created");
  });

  test("handles n8n format without signature verification requirement", async () => {
    const client = getPersistenceClient();
    const now = Date.now();

    // Configure settings for n8n format only on "task.updated"
    await client.execute({ sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)", args: ["n8n_webhook_url", `"${`http://127.0.0.1:${port}/n8n`}"`, now] });
    await client.execute({ sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)", args: ["n8n_events", JSON.stringify(["task.updated"]), now] });

    // Dispatch an event that SHOULD NOT trigger the webhook
    await dispatchTaskEvent("task.created", { id: "test-task-none", title: "N8N Task" });

    // Wait a brief moment
    await new Promise(r => setTimeout(r, 500));
    expect(receivedRequests.length).toBe(0);

    // Dispatch an event that SHOULD trigger the webhook
    await dispatchTaskEvent("task.updated", { id: "test-task-update", status: "done" });

    // Wait for webhook
    await expect.poll(() => receivedRequests.length).toBe(1);

    const req = receivedRequests[0]!;
    const payload = JSON.parse(req.body);

    expect(payload.eventType).toBe("task.updated");
    expect(payload.payload.status).toBe("done");
    expect(req.headers["x-meitheal-event"]).toBe("task.updated");
  });
});
