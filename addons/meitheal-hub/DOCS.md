# Meitheal Hub Add-on Docs

## Installation

1. Add the Meitheal repository to Home Assistant add-on repositories.
2. Install the `Meitheal Hub` add-on.
3. Start the add-on.
4. Open Web UI via ingress.

## Configuration

- `log_level`: `debug|info|warn|error`
- `log_categories`: log categories to emit
- `log_redaction`: redact tokens/PII
- `audit_enabled`: emit audit log records
- `loki_url`: Loki push endpoint for observability pipeline

## Runtime Notes

- Uses SQLite at `/data/meitheal.db` by default.
- Runs DB migrations on startup.
- Uses `SUPERVISOR_TOKEN` for Home Assistant API service calls when available.
- Health endpoint: `GET /api/health`.

## Publishing Requirements

- `image` is configured in `config.yaml` and uses the `{arch}` suffix.
- Version tags and published container tags should match add-on `version`.
- Root `repository.yaml` must stay present for repository publishing.
