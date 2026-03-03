#!/usr/bin/with-contenv bashio
set -euo pipefail

MEITHEAL_VERSION="0.1.35"
STARTUP_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "{\"event\":\"addon.startup\",\"version\":\"${MEITHEAL_VERSION}\",\"time\":\"${STARTUP_TS}\"}"

export MEITHEAL_LOG_LEVEL="$(bashio::config 'log_level')"
export MEITHEAL_LOG_REDACTION="$(bashio::config 'log_redaction')"
export MEITHEAL_AUDIT_ENABLED="$(bashio::config 'audit_enabled')"
export LOKI_URL="$(bashio::config 'loki_url')"

# Ensure /data is writable by meitheal user.
# HA Supervisor mounts a fresh volume here which may have root-only permissions.
mkdir -p /data
chown -R meitheal:meitheal /data 2>/dev/null || true

export MEITHEAL_DB_URL="${MEITHEAL_DB_URL:-file:/data/meitheal.db}"

# Prefer Supervisor credentials for direct Home Assistant service calls.
if [ -n "${SUPERVISOR_TOKEN:-}" ]; then
  export HA_BASE_URL="${HA_BASE_URL:-http://supervisor/core}"
  export HA_TOKEN="${HA_TOKEN:-$SUPERVISOR_TOKEN}"
fi

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=128}"
HEALTHCHECK_URL="http://127.0.0.1:${PORT}/api/health"

# ── Auto-install Meitheal custom component ──
COMPONENT_SRC="/opt/meitheal/custom_components/meitheal"
COMPONENT_DST="/homeassistant/custom_components/meitheal"
if [ -d "$COMPONENT_SRC" ] && [ -d "/homeassistant" ]; then
  mkdir -p /homeassistant/custom_components
  if [ ! -f "$COMPONENT_DST/manifest.json" ] || \
     ! diff -q "$COMPONENT_SRC/manifest.json" "$COMPONENT_DST/manifest.json" >/dev/null 2>&1; then
    cp -r "$COMPONENT_SRC" /homeassistant/custom_components/
    COMP_VER=$(grep '"version"' "$COMPONENT_DST/manifest.json" 2>/dev/null | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
    echo "{\"event\":\"component.installed\",\"version\":\"${COMP_VER:-unknown}\",\"path\":\"$COMPONENT_DST\",\"time\":\"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\"}"
  fi
fi

if [ -f /opt/meitheal/apps/web/package.json ]; then
  (
    cd /opt/meitheal/apps/web
    pnpm run db:migrate
    exit_code=$?
    if [ "${exit_code}" -ne 0 ]; then
      echo "Database migration failed: 'pnpm run db:migrate' exited with ${exit_code}" >&2
      exit "${exit_code}"
    fi
    if [ ! -f dist/server/entry.mjs ]; then
      echo "Missing Astro server entry at dist/server/entry.mjs"
      exit 1
    fi
    echo "{\"event\":\"web.starting\",\"host\":\"${HOST}\",\"port\":\"${PORT}\",\"time\":\"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\"}"
    node dist/server/entry.mjs
  ) &
  WEB_PID=$!

  for attempt in $(seq 1 15); do
    if curl -fsS "${HEALTHCHECK_URL}" >/dev/null 2>&1; then
      echo "{\"event\":\"healthcheck.passed\",\"attempt\":${attempt},\"time\":\"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\"}"
      break
    fi
    sleep 1
    if [ "${attempt}" -eq 15 ]; then
      echo "Meitheal startup healthcheck did not pass after ${attempt} attempts" >&2
      exit 1
    fi
  done
fi

# Placeholder for Alloy sidecar integration path.
# In production add-on packaging, run alloy with config below.
if [ -f /opt/meitheal/meitheal-hub/rootfs/etc/alloy/config.river ]; then
  echo "Alloy config present at /opt/meitheal/meitheal-hub/rootfs/etc/alloy/config.river"
fi

wait -n
