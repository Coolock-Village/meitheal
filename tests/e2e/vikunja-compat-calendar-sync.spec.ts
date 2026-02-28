import os from "node:os";
import path from "node:path";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { type AddressInfo } from "node:net";
import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { integrationAttempts, tasks } from "../../apps/web/drizzle/schema";
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
  process.env.MEITHEAL_DB_URL = makeDbUrl("vikunja-compat-calendar");
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

test("compat task create uses HA adapter when calendar sync mode is enabled", async () => {
  let createEventCalls = 0;
  let seenAuthorization = "";
  let seenEntity = "";
  const harness = await startServer((req, res) => {
    if (req.url !== "/api/services/calendar/create_event") {
      res.writeHead(404).end();
      return;
    }

    const chunks: Uint8Array[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      createEventCalls += 1;
      seenAuthorization = req.headers.authorization ?? "";
      const payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { entity_id?: string };
      seenEntity = payload.entity_id ?? "";
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify([{ uid: "compat-calendar-uid-1" }]));
    });
  });

  try {
    process.env.MEITHEAL_COMPAT_CALENDAR_SYNC_MODE = "enabled";
    process.env.HA_BASE_URL = harness.baseUrl;
    process.env.HA_TOKEN = "compat-ha-token";

    const created = await createVikunjaTask({
      projectId: 1,
      title: "Compat calendar enabled task",
      requestId: "req-vikunja-compat-calendar-enabled",
      idempotencyKey: "idem-vikunja-compat-calendar-enabled"
    });

    expect(createEventCalls).toBe(1);
    expect(seenAuthorization).toBe("Bearer compat-ha-token");
    expect(seenEntity).toBe("calendar.home");
    expect(typeof created.id).toBe("string");

    const db = getDb();
    const [taskRow] = await db.select().from(tasks).where(eq(tasks.id, created.id)).limit(1);
    expect(taskRow?.calendarSyncState).toBe("confirmed");

    const [attempt] = await db
      .select()
      .from(integrationAttempts)
      .where(eq(integrationAttempts.taskId, created.id))
      .limit(1);
    expect(attempt?.status).toBe("succeeded");
  } finally {
    await harness.close();
  }
});
