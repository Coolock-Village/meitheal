# 21-02: SQLite Direct Database Download — Summary

Implemented the ability to securely download the underlying local database binary to guarantee data sovereignty.

## Files Modified

1. `apps/web/src/pages/api/export/database.ts` (NEW) - Serves the raw SQLite `.db` file by resolving the Drizzle local file path with appropriate `application/x-sqlite3` headers.
2. `apps/web/src/pages/settings.astro` - Added the "🗄️ Raw DB" download button next to the JSON/CSV methods.

## Self-Check: PASS

- `settings.astro` UI was updated successfully.
- API route cleanly streams the filesystem-backed SQLite data source.
