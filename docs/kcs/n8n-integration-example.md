# n8n / Node-RED Integration Examples

## Architecture

Meitheal emits HMAC-signed webhooks for domain events. n8n and Node-RED consume these as standard webhook receivers — **no custom Meitheal adapter needed**.

## Example 1: Task Created → Grocy Stock Check → Shopping List

**Flow:** New task with grocery items → check Grocy stock → add missing items to shopping list → create "Go to Store" task.

### n8n

1. **Webhook node** — receive `task.created` events
   - Method: POST
   - Path: `/webhook/meitheal`
   - Authentication: HMAC with your webhook secret
2. **IF node** — check `payload.frameworkFields` contains grocery items
3. **HTTP Request node** — GET `http://grocy:9283/api/stock`
4. **Function node** — compare task items vs stock, find missing
5. **HTTP Request node** — POST `http://grocy:9283/api/stock/shoppinglist/add-product`
6. **HTTP Request node** — POST back to Meitheal: create "Go to Store" task

### Node-RED

```json
[
  { "type": "http in", "url": "/webhook/meitheal", "method": "post" },
  { "type": "function", "func": "// Verify HMAC signature\n// Filter task.created events" },
  { "type": "http request", "url": "http://grocy:9283/api/stock" },
  { "type": "function", "func": "// Compare stock, find missing items" },
  { "type": "http request", "url": "http://grocy:9283/api/stock/shoppinglist/add-product" }
]
```

## Example 2: Framework Score → Notification

**Flow:** Framework scoring completed → send notification via Telegram/Slack.

### n8n

1. **Webhook node** — receive `framework.score.applied`
2. **Function node** — format message: "Task '{title}' scored {score}/100"
3. **Telegram/Slack node** — send formatted message

## Example 3: Calendar Sync Failed → PagerDuty Alert

### n8n

1. **Webhook node** — receive `webhook.delivery.failed`
2. **IF node** — filter for critical subscribers
3. **PagerDuty node** — create incident

---

*Last updated: 2026-02-28 — Phase 2 Integration Deepening*
