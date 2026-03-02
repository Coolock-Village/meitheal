# Meitheal Hub Add-on Docs

## Installation

### From HA Add-on Store (after publishing)

1. Add the Meitheal repository to Home Assistant add-on repositories.
2. Install the `Meitheal Hub` add-on.
3. Start the add-on.
4. Open Web UI via ingress.

### Self-Install on Your HA Green (pre-publishing)

1. Open Home Assistant → **Settings** → **Add-ons** → **Add-on Store**.
2. Click **⋮** (top-right) → **Repositories**.
3. Add: `https://github.com/Coolock-Village/meitheal`
4. Close the dialog, then search for **Meitheal Hub**.
5. Click **Install** → **Start** → **Open Web UI**.

> **Rapid development mode:** After pushing new images to Docker Hub, go to the add-on page → **⋮** → **Reload** to pick up new versions. Then click **Update** + **Restart** to get the latest build.

### Local Testing (no HA required)

```bash
# Build from repo root
podman build --build-arg BUILD_FROM="ghcr.io/home-assistant/amd64-base:3.20" \
  -f meitheal-hub/Dockerfile -t local/meitheal-hub .

# Run standalone (no Supervisor)
podman run --rm -p 3333:3000 -v /tmp/meitheal-data:/data \
  local/meitheal-hub /run-local.sh

# Verify
curl http://localhost:3333/api/health
```

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

## Calendar Sync

Meitheal includes bidirectional calendar sync with Home Assistant calendar entities.

### How It Works

When running as an HA addon with `homeassistant_api: true`, Meitheal:

1. **Detects** your HA calendar entities automatically via WebSocket subscription
2. **Imports** calendar events (past 7 days → next 30 days) as Meitheal tasks
3. **Deduplicates** via a `calendar_confirmations` table — re-syncing never creates duplicate tasks
4. **Pushes back** task due dates as HA calendar events (when write-back is enabled)

### Calendar Settings

Configure in **Settings → Integrations → Calendar Sync**:

| Setting         | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| Calendar Entity | The HA calendar entity to sync with (e.g. `calendar.family`)        |
| CalDAV URL      | Optional direct CalDAV sync for non-HA calendars (Nextcloud, etc.)   |
| Write-back      | Push task due dates to HA calendar as events                         |

### API Endpoints

- `GET /api/ha/calendars` — List detected calendar entities and sync status
- `GET /api/ha/calendars?entity_id=X&start=Y&end=Z` — Get events for a specific calendar
- `POST /api/ha/calendars` — Trigger manual sync

### Calendar Page

The `/calendar` page renders a monthly grid showing tasks by due date. Click any day to filter tasks for that date. The calendar respects your configured week start day (Monday, Sunday, or Saturday).

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
- **Container isolation**: Runs with Docker namespace isolation + AppArmor profile
- **tmpfs**: `/tmp` mounted as tmpfs (ephemeral, no disk persistence)
- **Panel admin**: Sidebar panel restricted to HA admin users

## Publishing Requirements

- `image` is configured in `config.yaml` and uses the `{arch}` suffix.
- Images are published to Docker Hub under `coolockvillage/meitheal-hub-{arch}`.
- Version tags and published container tags should match add-on `version`.
- Root `repository.yaml` must stay present for repository publishing.
- `apparmor.txt` must be present alongside `config.yaml`.
- `translations/en.yaml` provides English option descriptions.
- `icon.png` (128×128) and `logo.png` (250×100) present in addon folder.
