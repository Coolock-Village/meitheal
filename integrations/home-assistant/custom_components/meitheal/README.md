# Meitheal Home Assistant Custom Component (Scaffold)

This component path is maintained for HACS/custom-component interoperability.

Primary Meitheal runtime remains the HA OS add-on (`meitheal-hub`).

## Service Contract

The component exposes `meitheal.create_task` with two modes:

1. `native` (default)
- Calls `POST /api/tasks/create`.
- Payload: `title`, optional `description`.

2. `vikunja_compat`
- Calls `PUT /api/v1/projects/{project_id}/tasks`.
- Payload: `title`, optional `description`.
- Uses `MEITHEAL_VIKUNJA_API_TOKEN` when present.

## Environment Variables

- `MEITHEAL_API_BASE_URL` (default: `http://localhost:3000`)
- `MEITHEAL_VIKUNJA_API_TOKEN` (optional compat bearer token)
