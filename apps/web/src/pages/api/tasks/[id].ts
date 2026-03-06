import type { APIRoute } from "astro";
import type { InValue } from "@libsql/client";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { sanitize } from "../../../lib/sanitize";
import { formatTicketKey } from "../../../lib/ticket-key";
import { dispatchTaskEvent } from "../../../lib/webhook-dispatcher";
import { logApiError } from "../../../lib/api-logger";
import { VALID_TASK_TYPES } from "@meitheal/domain-tasks";
import type { TaskType } from "@meitheal/domain-tasks";

/** GET /api/tasks/[id], PUT /api/tasks/[id], DELETE /api/tasks/[id] */

export const GET: APIRoute = async ({ params }) => {
  await ensureSchema();
  const client = getPersistenceClient();
  let id = params.id!;
  let parsedTicketNum = null;
  if (id.toUpperCase().startsWith("MTH-")) {
    parsedTicketNum = parseInt(id.slice(4), 10);
  }

  const result = await client.execute({
    sql: `SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.labels,
                 t.framework_payload, t.calendar_sync_state, t.board_id, t.custom_fields,
                 t.parent_id, t.time_tracked, t.start_date, t.end_date, t.progress, t.color,
                 t.is_favorite, t.task_type, t.ticket_number, t.assigned_to, t.checklists, t.created_at, t.updated_at,
                 p.title as parent_title, p.task_type as parent_task_type, p.ticket_number as parent_ticket_number
          FROM tasks t
          LEFT JOIN tasks p ON t.parent_id = p.id
          WHERE t.id = ? OR t.ticket_number = ? LIMIT 1`,
    args: [id, parsedTicketNum],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    return new Response(JSON.stringify({ error: "Task not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  // Derive human-readable ticket keys
  const ticketNum = row.ticket_number != null ? Number(row.ticket_number) : null;
  const parentTicketNum = row.parent_ticket_number != null ? Number(row.parent_ticket_number) : null;
  const enriched = {
    ...row,
    ticket_key: formatTicketKey(ticketNum),
    parent_ticket_key: formatTicketKey(parentTicketNum),
  };

  return new Response(JSON.stringify(enriched), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  await ensureSchema();
  const client = getPersistenceClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const now = Date.now();

  let id = params.id!;
  let parsedTicketNum = null;
  if (id.toUpperCase().startsWith("MTH-")) {
    parsedTicketNum = parseInt(id.slice(4), 10);
  }

  // Check task exists
  const existing = await client.execute({
    sql: "SELECT id, updated_at FROM tasks WHERE id = ? OR ticket_number = ? LIMIT 1",
    args: [id, parsedTicketNum],
  });
  if (existing.rows.length === 0) {
    return new Response(JSON.stringify({ error: "Task not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  // Optimistic locking: reject stale updates (Persona #7)
  if (typeof body.updated_at === "number") {
    const stored = Number((existing.rows[0]! as Record<string, unknown>).updated_at ?? 0);
    if (body.updated_at < stored) {
      return new Response(JSON.stringify({
        error: "Conflict: task was modified since your last read",
        server_updated_at: stored,
        client_updated_at: body.updated_at,
      }), {
        status: 409,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // Input sanitization — same rules as POST
  const sanitized: Record<string, InValue> = {};

  if (typeof body.title === "string") {
    const t = sanitize(body.title.trim());
    if (!t) {
      return new Response(JSON.stringify({ error: "title cannot be empty" }), {
        status: 400, headers: { "content-type": "application/json" },
      });
    }
    if (t.length > 500) {
      return new Response(JSON.stringify({ error: "title must be 500 characters or less" }), {
        status: 400, headers: { "content-type": "application/json" },
      });
    }
    sanitized.title = t;
  }
  if (typeof body.description === "string") {
    sanitized.description = sanitize(body.description.slice(0, 10000));
  }
  if (typeof body.status === "string") {
    const st = body.status.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!st || st.length > 50) {
      return new Response(JSON.stringify({ error: "status must be 1-50 alphanumeric/underscore characters" }), {
        status: 400, headers: { "content-type": "application/json" },
      });
    }
    sanitized.status = st;
  }
  if (typeof body.priority === "number") {
    sanitized.priority = Math.min(5, Math.max(1, Math.round(body.priority)));
  }
  if (body.due_date !== undefined) {
    sanitized.due_date = typeof body.due_date === "string" ? body.due_date : null;
  }
  if (body.labels !== undefined) {
    if (typeof body.labels !== "string") {
      return new Response(JSON.stringify({ error: "labels must be a JSON string array" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    try {
      const parsed = JSON.parse(body.labels);
      if (!Array.isArray(parsed) || !parsed.every(item => typeof item === "string")) throw new Error();
      sanitized.labels = body.labels;
    } catch {
      return new Response(JSON.stringify({ error: "labels must be a valid JSON string array" }), { status: 400, headers: { "content-type": "application/json" } });
    }
  }
  if (body.framework_payload !== undefined) {
    if (typeof body.framework_payload !== "string") {
      return new Response(JSON.stringify({ error: "framework_payload must be a JSON string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    try {
      const parsed = JSON.parse(body.framework_payload);
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) throw new Error();
      sanitized.framework_payload = body.framework_payload;
    } catch {
      return new Response(JSON.stringify({ error: "framework_payload must be a valid JSON object string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
  }
  if (body.custom_fields !== undefined) {
    if (typeof body.custom_fields !== "string") {
      return new Response(JSON.stringify({ error: "custom_fields must be a JSON string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    try {
      const parsed = JSON.parse(body.custom_fields);
      // must be an object, not array or null
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) throw new Error();
      sanitized.custom_fields = body.custom_fields;
    } catch {
      return new Response(JSON.stringify({ error: "custom_fields must be a valid JSON object string" }), { status: 400, headers: { "content-type": "application/json" } });
    }
  }
  if (typeof body.board_id === "string") {
    sanitized.board_id = body.board_id;
  }
  // Phase 18: Extended fields
  if (body.start_date !== undefined) {
    sanitized.start_date = typeof body.start_date === "string" ? body.start_date : null;
  }
  if (body.end_date !== undefined) {
    sanitized.end_date = typeof body.end_date === "string" ? body.end_date : null;
  }
  if (typeof body.progress === "number") {
    sanitized.progress = Math.min(100, Math.max(0, Math.round(body.progress)));
  }
  if (body.color !== undefined) {
    sanitized.color = typeof body.color === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(body.color) ? body.color : null;
  }
  if (body.is_favorite !== undefined) {
    sanitized.is_favorite = body.is_favorite ? 1 : 0;
  }
  if (typeof body.parent_id === "string" || body.parent_id === null) {
    sanitized.parent_id = body.parent_id;
  }
  if (typeof body.time_tracked === "number") {
    sanitized.time_tracked = Math.max(0, Math.round(body.time_tracked));
  }
  // Phase 20: Agile hierarchy type
  if (typeof body.task_type === "string") {
    const tt = body.task_type.trim().toLowerCase();
    if (VALID_TASK_TYPES.includes(tt as TaskType)) {
      sanitized.task_type = tt;
    }
  }
  // Assignments: assigned_to user ID (nullable)
  if (body.assigned_to !== undefined) {
    sanitized.assigned_to = typeof body.assigned_to === "string" && body.assigned_to.trim().length > 0 && body.assigned_to.length <= 255
      ? body.assigned_to.trim() : null;
  }
  // Phase 31: Checklists — JSON array of {text: string, done: boolean}
  if (body.checklists !== undefined) {
    if (typeof body.checklists !== "string") {
      return new Response(JSON.stringify({ error: "checklists must be a JSON string array" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    try {
      const parsed = JSON.parse(body.checklists);
      if (!Array.isArray(parsed)) throw new Error();
      // Validate each item has text (string) and done (boolean)
      for (const item of parsed) {
        if (typeof item !== "object" || item === null) throw new Error();
        if (typeof item.text !== "string") throw new Error();
        if (typeof item.done !== "boolean") throw new Error();
      }
      sanitized.checklists = body.checklists;
    } catch {
      return new Response(JSON.stringify({ error: "checklists must be a valid JSON array of {text, done} objects" }), { status: 400, headers: { "content-type": "application/json" } });
    }
  }

  const updates: string[] = [];
  const args: InValue[] = [];

  for (const [col, val] of Object.entries(sanitized)) {
    updates.push(`${col} = ?`);
    args.push(val);
  }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ error: "No fields to update" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const resolvedId = existing.rows[0]!.id as string;

  updates.push("updated_at = ?");
  args.push(now);
  args.push(resolvedId);

  // Fetch old values for activity log diffing
  const oldRow = await client.execute({
    sql: `SELECT title, description, status, priority, due_date, labels,
                 framework_payload, board_id, custom_fields, parent_id,
                 task_type, start_date, end_date, progress, color, is_favorite, assigned_to
          FROM tasks WHERE id = ? LIMIT 1`,
    args: [resolvedId],
  });
  const oldTask = oldRow.rows[0] as Record<string, unknown> | undefined;

  await client.execute({
    sql: `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`,
    args,
  });

  // Record activity log entries for each changed field
  if (oldTask) {
    const activityInserts: Promise<unknown>[] = [];
    for (const [field, newVal] of Object.entries(sanitized)) {
      const oldVal = oldTask[field];
      if (String(newVal) !== String(oldVal ?? "")) {
        activityInserts.push(
          client.execute({
            sql: `INSERT INTO task_activity_log (task_id, field, old_value, new_value, actor, created_at)
                  VALUES (?, ?, ?, ?, 'user', ?)`,
            args: [resolvedId, field, oldVal != null ? String(oldVal) : null, String(newVal), now] as InValue[],
          })
        );
      }
    }
    // Fire-and-forget — don't block the response on activity logging
    Promise.all(activityInserts).catch(() => { });
  }

  // Return updated
  const updated = await client.execute({
    sql: `SELECT id, title, description, status, priority, due_date, labels,
                 framework_payload, calendar_sync_state, board_id, custom_fields,
                 parent_id, time_tracked, start_date, end_date, progress, color,
                 is_favorite, task_type, ticket_number, assigned_to, checklists, created_at, updated_at
          FROM tasks WHERE id = ? LIMIT 1`,
    args: [resolvedId],
  });

  const updatedRow = updated.rows[0] as Record<string, unknown>;
  const updTicketNum = updatedRow?.ticket_number != null ? Number(updatedRow.ticket_number) : null;
  const taskPayload = { ...updatedRow, ticket_key: formatTicketKey(updTicketNum) };

  dispatchTaskEvent("task.updated", taskPayload, typeof body.request_id === "string" ? body.request_id : undefined).catch(() => {});

  // Notification preference guard — single read for all prefs (enabled, per-user, channels)
  let notifEnabled = true;
  let notifDisabledUsers: Set<string> = new Set();
  let notifChannels = { sidebar: true, mobile_push: false };
  let notifMobileTargets: string[] = [];
  try {
    const notifPrefsResult = await client.execute({
      sql: "SELECT value FROM settings WHERE key = 'notification_preferences' LIMIT 1",
      args: [],
    });
    if (notifPrefsResult.rows.length > 0) {
      const raw = JSON.parse(String((notifPrefsResult.rows[0] as Record<string, unknown>).value));
      if (typeof raw === "object" && raw !== null) {
        notifEnabled = raw.enabled !== false;
        if (Array.isArray(raw.disabled_users)) {
          notifDisabledUsers = new Set(raw.disabled_users);
        }
        if (raw.channels) notifChannels = raw.channels;
        if (Array.isArray(raw.mobile_targets)) notifMobileTargets = raw.mobile_targets;
      }
    }
  } catch { /* settings not available — default to enabled, sidebar channel */ }

  // F4/F5: Load callHAService once for all notification helpers
  const haServicesImport = import("../../../domains/ha/ha-services");

  // Helper: dispatch notification to configured channels
  // opts.isUrgent — P1 escalation: Android heads-up, iOS Focus bypass
  // opts.badgeCount — iOS badge on app icon (open task count)
  interface DispatchOpts { isUrgent?: boolean; badgeCount?: number }
  async function dispatchNotification(
    title: string, message: string, notifId: string,
    ingress: string | null, taskId?: string, opts: DispatchOpts = {},
  ) {
    const { callHAService } = await haServicesImport;
    const promises: Promise<unknown>[] = [];

    // Sidebar bell (persistent_notification) — markdown supported
    if (notifChannels.sidebar !== false) {
      promises.push(
        callHAService("persistent_notification", "create", {
          title,
          message,
          notification_id: notifId,
        }).catch(err => logApiError("ha-notify", "Failed to send sidebar notification", err))
      );
    }

    // Mobile push (notify.mobile_app_*) — enriched payloads
    if (notifChannels.mobile_push && notifMobileTargets.length > 0) {
      // Strip markdown links for push (mobile doesn't render markdown)
      const plainMessage = message.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      // Deep-link path: ingress path is a valid HA-internal relative URL
      const ingressPath = ingress ? ingress + "/kanban" : null;

      for (const target of notifMobileTargets) {
        const [domain, ...rest] = target.split(".");
        const service = rest.join(".");
        if (domain && service) {
          const pushData: Record<string, unknown> = {
            title,
            message: plainMessage,
            data: {
              // Deep-link: tap to open Meitheal (Android clickAction, iOS url)
              ...(ingressPath ? { clickAction: ingressPath, url: ingressPath } : {}),
              // Notification identity & dedup
              tag: notifId,
              group: "meitheal",
              // Android: notification channel — separate urgent from normal
              channel: opts.isUrgent ? "meitheal_urgent" : "meitheal_tasks",
              // Android: accent color (Meitheal green)
              color: "#10b981",
              // Android: importance — high = heads-up popup for urgent
              ...(opts.isUrgent ? { importance: "high" } : {}),
              // iOS: push payload enrichments
              push: {
                // time-sensitive bypasses Focus mode for urgent notifications
                "interruption-level": opts.isUrgent ? "time-sensitive" : "active",
                // Badge count: show open task count on HA app icon
                ...(opts.badgeCount !== undefined ? { badge: opts.badgeCount } : {}),
              },
              // Actionable notification buttons
              actions: [
                ...(ingressPath ? [{
                  action: "URI",
                  title: "Open Task",
                  uri: ingressPath,
                }] : []),
                ...(taskId ? [{
                  action: `MEITHEAL_TASK_DONE_${taskId}`,
                  title: "✅ Mark Done",
                }] : []),
              ],
            },
          };
          promises.push(
            callHAService(domain, service, pushData)
              .catch(err => logApiError("ha-notify", `Failed to send mobile push to ${target}`, err))
          );
        }
      }
    }

    return Promise.all(promises);
  }

  // Helper: dismiss mobile notifications for a task (on completion)
  async function dismissMobileNotification(notifTag: string) {
    if (!notifChannels.mobile_push || notifMobileTargets.length === 0) return;
    const { callHAService } = await haServicesImport;
    for (const target of notifMobileTargets) {
      const [domain, ...rest] = target.split(".");
      const service = rest.join(".");
      if (domain && service) {
        callHAService(domain, service, {
          message: "clear_notification",
          data: { tag: notifTag },
        }).catch(() => {}); // best-effort — don't block
      }
    }
  }

  // F7: Module-scope done statuses (avoid allocation on every PUT)
  const doneStatuses = new Set(["done", "complete", "completed"]);

  // Fetch open task count for iOS badge (fire-and-forget, cached per-request)
  let openTaskBadge: number | undefined;
  async function getOpenTaskBadge(): Promise<number> {
    if (openTaskBadge !== undefined) return openTaskBadge;
    try {
      const countResult = await client.execute({
        sql: "SELECT COUNT(*) as cnt FROM tasks WHERE status NOT IN ('done', 'complete', 'completed')",
        args: [],
      });
      openTaskBadge = Number((countResult.rows[0] as Record<string, unknown>).cnt) || 0;
    } catch { openTaskBadge = 0; }
    return openTaskBadge;
  }

  // Phase 52: Notification if bumped to Urgent (P1)
  if (notifEnabled && sanitized.priority === 1 && oldTask?.priority !== 1) {
    import("../../../domains/ha/ha-connection").then(async ({ getIngressEntry }) => {
      const ingress = await getIngressEntry();
      const titleStr = typeof sanitized.title === "string" ? sanitized.title : String(oldTask?.title ?? "Task");
      const ticketKey = taskPayload.ticket_key ?? "Task";
      const link = ingress ? `\n\n[Open ${ticketKey} in Meitheal →](${ingress}/kanban)` : "";
      const badge = await getOpenTaskBadge();
      dispatchNotification(
        `🚨 Escalated to Urgent: ${titleStr}`,
        `${ticketKey} has been escalated to P1 — Urgent.${link}`,
        `meitheal_urgent_${resolvedId}`,
        ingress,
        resolvedId,
        { isUrgent: true, badgeCount: badge },
      ).catch(() => {});
    }).catch(() => {});
  }

  // Assignment-change notification (respects per-user prefs)
  if (notifEnabled && sanitized.assigned_to !== undefined && String(sanitized.assigned_to) !== String(oldTask?.assigned_to ?? "")) {
    const assignee = typeof sanitized.assigned_to === "string" ? sanitized.assigned_to : null;
    if (assignee && !notifDisabledUsers.has(assignee)) {
      import("../../../domains/ha/ha-connection").then(async ({ getIngressEntry }) => {
        const ingress = await getIngressEntry();
        const titleStr = typeof sanitized.title === "string" ? sanitized.title : String(oldTask?.title ?? "Task");
        const ticketKey = taskPayload.ticket_key ?? "A task";
        const link = ingress ? `\n\n[Open ${ticketKey} in Meitheal →](${ingress}/kanban)` : "";
        // Resolve human-readable display name from user ID
        let displayName = assignee.replace(/^(ha_|custom_)/, "");
        try {
          if (assignee.startsWith("ha_")) {
            const { listHAUsers } = await import("../../../domains/ha/ha-users");
            const haUsers = await listHAUsers();
            const match = haUsers.find(u => `ha_${u.id}` === assignee);
            if (match?.name) displayName = match.name;
          } else if (assignee.startsWith("custom_")) {
            const nameResult = await client.execute({ sql: "SELECT name FROM custom_users WHERE id = ? LIMIT 1", args: [assignee] });
            if (nameResult.rows.length > 0) displayName = String((nameResult.rows[0] as Record<string, unknown>).name);
          }
        } catch { /* fallback to stripped ID */ }
        const badge = await getOpenTaskBadge();
        dispatchNotification(
          `📋 Task assigned: ${titleStr}`,
          `${ticketKey} has been assigned to ${displayName}.${link}`,
          `meitheal_assigned_${resolvedId}`,
          ingress,
          resolvedId,
          { badgeCount: badge },
        ).catch(() => {});
      }).catch(() => {});
    }
  }

  // Auto-dismiss all notifications when task is marked done/complete
  if (notifEnabled && sanitized.status !== undefined) {
    if (doneStatuses.has(String(sanitized.status)) && !doneStatuses.has(String(oldTask?.status ?? ""))) {
      // F13: Clear urgent, assignment, AND due-date reminder notification tags
      dismissMobileNotification(`meitheal_urgent_${resolvedId}`);
      dismissMobileNotification(`meitheal_assigned_${resolvedId}`);
      dismissMobileNotification(`meitheal_due_${resolvedId}`);
      // Also dismiss sidebar persistent notifications
      if (notifChannels.sidebar !== false) {
        haServicesImport.then(({ callHAService }) => {
          callHAService("persistent_notification", "dismiss", { notification_id: `meitheal_urgent_${resolvedId}` }).catch(() => {});
          callHAService("persistent_notification", "dismiss", { notification_id: `meitheal_assigned_${resolvedId}` }).catch(() => {});
          callHAService("persistent_notification", "dismiss", { notification_id: `meitheal_due_${resolvedId}` }).catch(() => {});
        }).catch(() => {});
      }
    }
  }

  return new Response(JSON.stringify(taskPayload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await ensureSchema();
  const client = getPersistenceClient();

  let id = params.id!;
  let parsedTicketNum = null;
  if (id.toUpperCase().startsWith("MTH-")) {
    parsedTicketNum = parseInt(id.slice(4), 10);
  }

  const existing = await client.execute({
    sql: "SELECT id FROM tasks WHERE id = ? OR ticket_number = ? LIMIT 1",
    args: [id, parsedTicketNum],
  });
  if (existing.rows.length === 0) {
    return new Response(JSON.stringify({ error: "Task not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const resolvedId = existing.rows[0]!.id as string;
  await client.execute({ sql: "DELETE FROM tasks WHERE id = ?", args: [resolvedId] });

  // Orphan link cleanup (#10): remove all links referencing deleted task
  try {
    await client.execute({
      sql: "DELETE FROM task_links WHERE source_task_id = ? OR target_task_id = ?",
      args: [resolvedId, resolvedId],
    });
  } catch { /* task_links table may not exist yet — non-critical */ }

  dispatchTaskEvent("task.deleted", { id: resolvedId }).catch(() => {});

  // Clean up any associated calendar events (fire-and-forget)
  import("../../../domains/calendar/calendar-bridge").then(({ removeTaskCalendarEvent }) => {
    removeTaskCalendarEvent(resolvedId).catch(() => {});
  }).catch(() => {});

  return new Response(null, { status: 204 });
};
