# Worker API Reference

## Authentication

All `/api/v1/*` routes require a bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-worker.workers.dev/api/v1/tasks
```

Set the token via: `wrangler secret put MEITHEAL_VIKUNJA_API_TOKEN`

## Endpoints

### Health & Runtime

```bash
# Health check (no auth needed)
curl https://your-worker.workers.dev/health

# Runtime detection (no auth needed)
curl https://your-worker.workers.dev/api/runtime
```

### Tasks CRUD

```bash
# List tasks
curl -H "Authorization: Bearer $TOKEN" \
  https://your-worker.workers.dev/api/v1/tasks

# Get task
curl -H "Authorization: Bearer $TOKEN" \
  https://your-worker.workers.dev/api/v1/tasks/TASK_ID

# Create task
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","description":"Milk and bread","due_date":"2026-03-01"}' \
  https://your-worker.workers.dev/api/v1/tasks

# Update task (with conflict detection)
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "If-Match: 2026-02-28T03:00:00Z" \
  -d '{"status":"done"}' \
  https://your-worker.workers.dev/api/v1/tasks/TASK_ID

# Delete task
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  https://your-worker.workers.dev/api/v1/tasks/TASK_ID
```

### GDPR Data Deletion

```bash
# Delete ALL user data (irreversible)
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  https://your-worker.workers.dev/api/v1/user/data
```

## Error Responses

| Status | Meaning |
|--------|---------|
| 401 | Missing or invalid bearer token |
| 403 | CSRF validation failed (Origin/Sec-Fetch-Site mismatch) |
| 404 | Route or resource not found |
| 409 | Stale update — task modified since your last read. Response includes `current` task state |
| 429 | Rate limited (100 req/min per IP). Check `x-ratelimit-remaining` header |
| 500 | Internal error |
| 503 | D1 unavailable. Check `Retry-After` header (30s) |

## Security

- **Auth:** Constant-time token comparison (no timing side-channel)
- **CSRF:** Origin + Sec-Fetch-Site validation on mutating requests
- **Rate limiting:** Token bucket, 100 req/min per SHA-256-hashed IP
- **IPs:** Never stored in plaintext — SHA-256 hashed before bucketing

## Domain Events

All CRUD operations emit structured domain events:

| Event | Trigger |
|-------|---------|
| `task.created` | POST /api/v1/tasks |
| `task.updated` | PUT /api/v1/tasks/:id |
| `task.deleted` | DELETE /api/v1/tasks/:id |
| `user.data.deletion.requested` | DELETE /api/v1/user/data (before deletion) |
| `user.data.deleted` | DELETE /api/v1/user/data (after deletion) |

---

*OpenAPI spec: `apps/api/openapi.yaml`*
*Last updated: 2026-02-28 — Phase 5 Market Parity*
