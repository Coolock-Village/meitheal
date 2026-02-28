#!/usr/bin/with-contenv bashio
set -euo pipefail

export MEITHEAL_LOG_LEVEL="$(bashio::config 'log_level')"
export MEITHEAL_LOG_REDACTION="$(bashio::config 'log_redaction')"
export MEITHEAL_AUDIT_ENABLED="$(bashio::config 'audit_enabled')"
export LOKI_URL="$(bashio::config 'loki_url')"

# Start web app (placeholder command for scaffold)
if [ -f /opt/meitheal/apps/web/package.json ]; then
  (cd /opt/meitheal/apps/web && pnpm run dev --host 0.0.0.0 --port 3000) &
fi

# Placeholder for Alloy sidecar integration path.
# In production add-on packaging, run alloy with config below.
if [ -f /opt/meitheal/addons/meitheal-hub/rootfs/etc/alloy/config.river ]; then
  echo "Alloy config present at /opt/meitheal/addons/meitheal-hub/rootfs/etc/alloy/config.river"
fi

wait -n
