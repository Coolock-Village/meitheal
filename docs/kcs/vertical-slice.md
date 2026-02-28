# Vertical Slice Runbook (Iteration 1)

## Flow

1. `POST /api/tasks/create`
- Creates task with optional framework payload.
- Emits domain events: task created, framework applied, integration sync requested.
- Persists task, event, integration attempt, and audit rows before integration call.
- Calls Home Assistant calendar service directly (`calendar.create_event`).

2. `POST /api/integrations/calendar/confirmation`
- Records calendar confirmation for a task.
- Emits integration audit log events.
- Uses idempotent persistence (`taskId + confirmationId`) for replay-safe callbacks.

3. Observability
- JSON log lines written to stdout for Alloy/Loki ingestion.

## Notes

This slice is persistence-backed via SQLite and Drizzle.
