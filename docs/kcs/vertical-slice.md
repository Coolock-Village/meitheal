# Vertical Slice Runbook (Iteration 2+)

## Flow

1. `POST /api/tasks/create`
- Creates task with optional framework payload.
- Emits domain events: task created, framework applied, integration sync requested.
- Persists task, event, integration attempt, and audit rows before integration call.
- Calls Home Assistant calendar service directly (`calendar.create_event`).

2. `POST /api/integrations/calendar/confirmation`
- Records calendar confirmation for a task.
- Emits integration audit log events.
- Uses idempotent persistence (`taskId + requestId`) for replay-safe callbacks.

3. `PUT /api/v1/projects/{id}/tasks` (compat mode)
- Token-gated Vikunja-compatible create route for voice assistant interoperability.
- Honors `compatibility.vikunja_api.calendar_sync_mode` (`disabled` default, `enabled` optional).
- Persists compatibility metadata for labels/assignees/project mapping.

4. Observability
- JSON log lines written to stdout for Alloy/Loki ingestion.

## Notes

This slice is persistence-backed via SQLite and Drizzle.
