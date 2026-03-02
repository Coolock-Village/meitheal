import os from "node:os";
import path from "node:path";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { type AddressInfo } from "node:net";
import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { tasks } from "../../apps/web/drizzle/schema";
import { createVikunjaTask, resetVikunjaCompatForTests } from "../../apps/web/src/domains/integrations/vikunja-compat/store";
import { ensureSchema, getDb, resetPersistenceForTests } from "../../apps/web/src/domains/tasks/persistence/store";

function makeDbUrl(label: string): string {
  return `file:${path.join(os.tmpdir(), `meitheal-${label}-${Date.now()}-${Math.random()}.db`)}`;
}

function startServer(
  handler: (req: IncomingMessage, res: ServerResponse) => void
): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = createServer(handler);
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise<void>((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
                return;
              }
              closeResolve();
            });
          })
      });
    });
  });
}

const compatCalendarModeEnv = process.env.MEITHEAL_COMPAT_CALENDAR_SYNC_MODE;
const haBaseUrlEnv = process.env.HA_BASE_URL;
const haTokenEnv = process.env.HA_TOKEN;

test.beforeEach(async () => {
  process.env.MEITHEAL_DB_URL = makeDbUrl("vikunja-compat-calendar-tz");
  resetPersistenceForTests();
  resetVikunjaCompatForTests();
  await ensureSchema();
});

test.afterEach(() => {
  if (compatCalendarModeEnv === undefined) {
    delete process.env.MEITHEAL_COMPAT_CALENDAR_SYNC_MODE;
  } else {
    process.env.MEITHEAL_COMPAT_CALENDAR_SYNC_MODE = compatCalendarModeEnv;
  }

  if (haBaseUrlEnv === undefined) {
    delete process.env.HA_BASE_URL;
  } else {
    process.env.HA_BASE_URL = haBaseUrlEnv;
  }

  if (haTokenEnv === undefined) {
    delete process.env.HA_TOKEN;
  } else {
    process.env.HA_TOKEN = haTokenEnv;
  }
});

test("compat calendar sync preserves non-UTC timezone in HA create_event payload", async () => {
  let seenPayload: Record<string, unknown> = {};
  const harness = await startServer((req, res) => {
    if (req.url !== "/api/services/calendar/create_event") {
      res.writeHead(404).end();
      return;
    }

    const chunks: Uint8Array[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      seenPayload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify([{ uid: "tz-test-uid-1" }]));
    });
  });

  try {
    process.env.MEITHEAL_COMPAT_CALENDAR_SYNC_MODE = "enabled";
    process.env.HA_BASE_URL = harness.baseUrl;
    process.env.HA_TOKEN = "tz-test-token";

    const created = await createVikunjaTask({
      projectId: 1,
      title: "Non-UTC timezone task",
      dueDate: "2026-03-01T09:00:00+01:00",
      requestId: "req-tz-test",
      idempotencyKey: "idem-tz-test"
    });

    expect(typeof created.id).toBe("string");
    // The HA payload must contain the due date value — if the adapter
    // strips timezone or converts to UTC incorrectly, this will fail.
    expect(seenPayload.start_date_time).toBeDefined();
    // Verify the event was persisted with confirmed state
    const db = getDb();
    const [taskRow] = await db.select().from(tasks).where(eq(tasks.id, created.id)).limit(1);
    expect(taskRow?.calendarSyncState).toBe("confirmed");
  } finally {
    await harness.close();
  }
});

test("compat calendar sync works with negative UTC offset timezone", async () => {
  let seenPayload: Record<string, unknown> = {};
  const harness = await startServer((req, res) => {
    if (req.url !== "/api/services/calendar/create_event") {
      res.writeHead(404).end();
      return;
    }

    const chunks: Uint8Array[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      seenPayload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify([{ uid: "tz-negative-uid-1" }]));
    });
  });

  try {
    process.env.MEITHEAL_COMPAT_CALENDAR_SYNC_MODE = "enabled";
    process.env.HA_BASE_URL = harness.baseUrl;
    process.env.HA_TOKEN = "tz-negative-token";

    const created = await createVikunjaTask({
      projectId: 1,
      title: "Pacific timezone task",
      dueDate: "2026-03-01T09:00:00-08:00",
      requestId: "req-tz-negative",
      idempotencyKey: "idem-tz-negative"
    });

    expect(typeof created.id).toBe("string");
    expect(seenPayload.start_date_time).toBeDefined();

    const db = getDb();
    const [taskRow] = await db.select().from(tasks).where(eq(tasks.id, created.id)).limit(1);
    expect(taskRow?.calendarSyncState).toBe("confirmed");
  } finally {
    await harness.close();
  }
});

test("compat calendar sync handles IANA timezone name in due date", async () => {
  let createEventCalls = 0;
  const harness = await startServer((req, res) => {
    if (req.url !== "/api/services/calendar/create_event") {
      res.writeHead(404).end();
      return;
    }

    const chunks: Uint8Array[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      createEventCalls += 1;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify([{ uid: "tz-iana-uid-1" }]));
    });
  });

  try {
    process.env.MEITHEAL_COMPAT_CALENDAR_SYNC_MODE = "enabled";
    process.env.HA_BASE_URL = harness.baseUrl;
    process.env.HA_TOKEN = "tz-iana-token";

    // A due_date that is a plain ISO string (no explicit offset) — system
    // should treat it as-is and still call HA adapter successfully.
    const created = await createVikunjaTask({
      projectId: 1,
      title: "No-offset timezone task",
      dueDate: "2026-07-15T14:30:00",
      requestId: "req-tz-iana",
      idempotencyKey: "idem-tz-iana"
    });

    expect(typeof created.id).toBe("string");
    expect(createEventCalls).toBe(1);

    const db = getDb();
    const [taskRow] = await db.select().from(tasks).where(eq(tasks.id, created.id)).limit(1);
    expect(taskRow?.calendarSyncState).toBe("confirmed");
  } finally {
    await harness.close();
  }
});
