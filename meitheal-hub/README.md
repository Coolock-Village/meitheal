# Meitheal Hub Add-on

Meitheal Hub is the Home Assistant add-on runtime for Meitheal, the cooperative task and life engine for your home.

This add-on is Astro-first and runs the Meitheal web runtime with SQLite persistence and Home Assistant ingress support.

[![Docker Hub](https://img.shields.io/docker/v/coolockvillage/meitheal-hub-amd64?label=Docker%20Hub&logo=docker)](https://hub.docker.com/r/coolockvillage/meitheal-hub-amd64)

## Quick Install on HA Green

1. **Settings** → **Add-ons** → **Add-on Store** → **⋮** → **Repositories**
2. Add: `https://github.com/Coolock-Village/meitheal`
3. Find **Meitheal Hub** → **Install** → **Start** → **Open Web UI**

> **Updating:** After pushing new images, go to the add-on → **⋮** → **Check for updates**. Then **Update** + **Restart**.

## Screenshots

*Screenshots will be added once the UI is fully styled.*

## Local Testing

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

## Dev Build & Push

For rapid iteration during development:

```bash
# Login once
docker login -u coolockvillage

# Build and push :dev tag for both architectures
./meitheal-hub/build-push-dev.sh

# Build and push a versioned release
./meitheal-hub/build-push-dev.sh v0.1.0
```

## Files

| File | Purpose |
|------|---------|
| `config.yaml` | Add-on manifest (name, arch, ingress, options) |
| `Dockerfile` | Multi-stage build — Astro build + HA base image runtime |
| `build.json` | Architecture-specific base image registry |
| `run.sh` | Production entrypoint (uses bashio + Supervisor) |
| `run-local.sh` | Local testing entrypoint (standalone, no bashio) |
| `build-push-dev.sh` | Dev script to build + push to Docker Hub |
| `icon.png` | Add-on store icon (128×128) |
| `logo.png` | Add-on store logo (250×100) |
| `rootfs/` | Grafana Alloy config + dashboards |
| `DOCS.md` | Setup and operations details |

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `log_level` | `debug\|info\|warn\|error` | `info` | Logging verbosity |
| `log_redaction` | `bool` | `true` | Redact sensitive data in logs |
| `audit_enabled` | `bool` | `true` | Enable audit trail |
| `loki_url` | `str` | Loki add-on URL | Log aggregation endpoint |
