# Troubleshooting

## Common Issues

### IDB Quota Exceeded

**Symptoms**: Tasks fail to save locally, "QuotaExceededError" in console.

**Fix**:

1. Open DevTools → Application → Storage → Clear site data
2. Or delete the `meitheal-offline` database from IndexedDB directly
3. Monitor IDB usage in DevTools → Application → IndexedDB

### Service Worker Cache Stale

**Symptoms**: App shows old version, changes don't appear after deploy.

**Fix**:

1. Check for SW update prompt in the UI — accept it
2. Force update: DevTools → Application → Service Workers → Update
3. Hard refresh: Ctrl+Shift+R (clears SW cache)
4. Nuclear option: Unregister all service workers in DevTools

### HA Connection Timeout

**Symptoms**: Settings page shows "Connection failed" for Home Assistant.

**Fix**:

1. Verify the add-on is running in HA → Add-ons → Meitheal Hub
2. Check `SUPERVISOR_TOKEN` is available: inspect add-on logs for `Missing SUPERVISOR_TOKEN`
3. Test manually: `curl -s -H "Authorization: Bearer $SUPERVISOR_TOKEN" http://supervisor/core/api/config`
4. Verify `config.yaml` has `homeassistant_api: true` and `hassio_api: true`

### Sync Queue Stuck

**Symptoms**: "Pending" indicator never clears, tasks don't sync.

**Fix**:

1. Check connectivity indicator in sidebar — must show "Online"
2. Open DevTools → Console → Look for `[sync-engine]` messages
3. If max retries exceeded: clear site data to reset the queue
4. Force sync: navigate to any page while online

### Task Create API Returns 400

**Symptoms**: Create task button does nothing, or shows error toast.

**Fix**:

1. Check browser console for the specific 400 error message
2. Most common: `title is required` — empty title field
3. Verify API is healthy: `GET /api/health` should return 200

### Offline Page Showing When Online

**Symptoms**: App shows offline fallback page despite having internet.

**Fix**:

1. Health check endpoint `/api/health` may be failing — check server logs
2. The connectivity monitor debounces state transitions by 2 seconds — wait briefly
3. Check if a VPN or proxy is blocking the health check request
