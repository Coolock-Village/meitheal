#!/usr/bin/with-contenv bashio
# Meitheal Supervisor Pre-Backup Script
#
# Called by HA Supervisor BEFORE snapshotting /data.
# Checkpoints the SQLite WAL to ensure database consistency.
#
# @see https://developers.home-assistant.io/docs/add-ons/configuration#optional-configuration-options

set -euo pipefail

BACKUP_URL="http://127.0.0.1:${PORT:-3000}/api/backup/prepare"

echo "{\"event\":\"backup.pre.start\",\"time\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}"

# Give the addon up to 30 seconds to flush the WAL
RESULT=$(curl -fsS -X POST -m 30 "${BACKUP_URL}" 2>/dev/null || true)

if echo "${RESULT}" | grep -q '"ok":true'; then
  echo "{\"event\":\"backup.pre.ok\",\"time\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}"
else
  # Non-fatal: Supervisor will still snapshot /data, but WAL may not be flushed.
  # The SQLite WAL file is included in the backup so data is still recoverable.
  echo "{\"event\":\"backup.pre.warn\",\"message\":\"WAL checkpoint may not have completed\",\"time\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" >&2
fi
