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

## Security

### AppArmor

Meitheal Hub ships with a restrictive AppArmor profile (`apparmor.txt`) that:

- **Allows** TCP/UDP network access for the Node.js web server
- **Allows** read/write to `/data/` (SQLite persistence) and `/tmp/`
- **Denies** write access to all system paths (`/bin/`, `/boot/`, `/sys/`, etc.)
- **Denies** shell access (`/bin/sh`, `/bin/dash`)
- **Denies** raw/packet sockets, mount operations, and proc/sys writes
- Runs with minimal capabilities: `chown`, `dac_override`, `setuid`, `setgid`, `net_bind_service`

The Supervisor enforces this profile automatically when `apparmor: true` is set in `config.yaml`.

### Ingress Authentication

When accessed through the HA sidebar (ingress), the Supervisor validates the user's session and injects identity headers:

| Header            | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `X-Ingress-Path` | The ingress proxy path prefix |
| `hassio_token` | Session validation token |
| `X-Hass-User-Id` | Authenticated HA user ID |
| `X-Hass-Is-Admin` | Whether the user is a HA admin (`true`/`false`) |

Meitheal validates these headers on all API routes and rejects requests missing required headers with HTTP 401.

### Auth API

With `auth_api: true`, Meitheal can validate user credentials against the Home Assistant authentication backend via the Supervisor API. This avoids storing separate credentials.

### Additional Protections

- **CSRF**: Origin/referer validation on mutating requests
- **Rate limiting**: Per-IP rate limiting (120 req/min) with `X-Forwarded-For` support for ingress proxy
- **Security headers**: X-Content-Type-Options, CSP, Referrer-Policy, Permissions-Policy
- **Non-root container**: Runs as the `meitheal` user, not root
- **tmpfs**: `/tmp` mounted as tmpfs (ephemeral, no disk persistence)
- **Panel admin**: Sidebar panel restricted to HA admin users

## Publishing Requirements

- `image` is configured in `config.yaml` and uses the `{arch}` suffix.
- Version tags and published container tags should match add-on `version`.
- Root `repository.yaml` must stay present for repository publishing.
- `apparmor.txt` must be present alongside `config.yaml`.
- `translations/en.yaml` provides English option descriptions.
