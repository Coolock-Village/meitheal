# Vertical Slice Runbook (Iteration 1)

## Flow

1. `POST /api/tasks/create`
- Creates task with optional framework payload.
- Emits domain events: task created, framework applied, integration sync requested.

2. `POST /api/integrations/calendar/confirmation`
- Records calendar confirmation for a task.
- Emits integration audit log events.

3. Observability
- JSON log lines written to stdout for Alloy/Loki ingestion.

## Notes

This is a scaffold slice. Storage for confirmations is currently in-memory and must be replaced with persistent storage in next iteration.
