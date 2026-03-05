# n8n / Node-RED Integration Examples

## Architecture

Meitheal supports two integration modes for n8n and Node-RED:

1. **HA Addon mode (auto)** — events flow via the **HA event bus** (`meitheal_task_*` events). Node-RED receives them through its built-in HA WebSocket integration. No webhook URL needed.
2. **Standalone mode** — HMAC-signed webhooks sent to configured URLs. Standard webhook receivers — **no custom Meitheal adapter needed**.

### HA Event Types

| Event Type | Fired When |
|---|---|
| `meitheal_task_created` | New task created |
| `meitheal_task_updated` | Task fields modified |
| `meitheal_task_completed` | Task status set to "done" |
| `meitheal_task_deleted` | Task deleted |
| `meitheal_board_updated` | Board configuration changed |

### Event Data Payload

```json
{
  "task_id": "uuid",
  "title": "Fix the roof",
  "board_id": "default",
  "priority": "1",
  "due_date": "2026-03-10",
  "completed_at": "2026-03-05T14:30:00Z"
}
```

## HA Addon Mode — Node-RED

When Node-RED runs as an HA addon, it connects to HA Core via WebSocket automatically. Use the `events: all` node to listen for Meitheal events.

### Node-RED Flow: Task Created → Notification

1. **events: all** node — Filter: `meitheal_task_created`
2. **function** node — Format message: `msg.payload = "New task: " + msg.payload.event.title;`
3. **call service** node — `notify.persistent_notification` with `{ message: msg.payload }`

### Node-RED Flow: Urgent Task → Mobile Alert

1. **events: all** node — Filter: `meitheal_task_created`
2. **switch** node — Check `msg.payload.event.priority === "1"`
3. **call service** node — `notify.mobile_app_DEVICE` with urgency data

### Configuration

1. Go to **Meitheal → Settings → Integrations → n8n / Node-RED**
2. Select **HA Addon** mode (auto-detected when Node-RED addon is installed)
3. Check which events you want to receive
4. Click **Save n8n Settings**

No webhook URL or API key needed in this mode.

## Standalone Mode — Webhooks

### Example 1: Task Created → Grocy Stock Check → Shopping List

**Flow:** New task with grocery items → check Grocy stock → add missing items to shopping list → create "Go to Store" task.

#### n8n

1. **Webhook node** — receive `task.created` events
   - Method: POST
   - Path: `/webhook/meitheal`
   - Authentication: HMAC with your webhook secret
2. **IF node** — check `payload.frameworkFields` contains grocery items
3. **HTTP Request node** — GET `http://grocy:9283/api/stock`
4. **Function node** — compare task items vs stock, find missing
5. **HTTP Request node** — POST `http://grocy:9283/api/stock/shoppinglist/add-product`
6. **HTTP Request node** — POST back to Meitheal: create "Go to Store" task

#### Node-RED

```json
[
  { "type": "http in", "url": "/webhook/meitheal", "method": "post" },
  { "type": "function", "func": "// Verify HMAC signature\n// Filter task.created events" },
  { "type": "http request", "url": "http://grocy:9283/api/stock" },
  { "type": "function", "func": "// Compare stock, find missing items" },
  { "type": "http request", "url": "http://grocy:9283/api/stock/shoppinglist/add-product" }
]
```

### Example 2: Framework Score → Notification

**Flow:** Framework scoring completed → send notification via Telegram/Slack.

#### n8n

1. **Webhook node** — receive `framework.score.applied`
2. **Function node** — format message: "Task '{title}' scored {score}/100"
3. **Telegram/Slack node** — send formatted message

### Example 3: Calendar Sync Failed → PagerDuty Alert

#### n8n

1. **Webhook node** — receive `webhook.delivery.failed`
2. **IF node** — filter for critical subscribers
3. **PagerDuty node** — create incident

---

*Last updated: 2026-03-05 — Node-RED HA Event Bus Integration Fix*
