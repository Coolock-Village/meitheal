/**
 * POST /api/backup/prepare — Pre-backup WAL checkpoint
 *
 * Called by HA Supervisor's backup_pre script before snapshotting /data.
 * Runs PRAGMA wal_checkpoint(TRUNCATE) to flush all WAL data into the
 * main database file, ensuring a consistent on-disk snapshot.
 *
 * @see https://developers.home-assistant.io/docs/add-ons/configuration#optional-configuration-options
 * Bounded Context: Infrastructure (backup)
 */
import type { APIRoute } from "astro";
import { getPersistenceClient } from "../../../domains/tasks/persistence/store";
import { apiLogger, logApiError } from "../../../lib/api-logger";

export const POST: APIRoute = async () => {
  try {
    const client = getPersistenceClient();

    // TRUNCATE mode: copy WAL content to DB, then reset the WAL file.
    // This ensures the main .db file is fully consistent for Supervisor snapshot.
    await client.execute("PRAGMA wal_checkpoint(TRUNCATE)");

    apiLogger.log("info", {
      event: "api.backup.prepare",
      domain: "backup",
      component: "backup-prepare",
      request_id: "supervisor",
      message: "WAL checkpoint (TRUNCATE) complete — database ready for backup",
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Database checkpoint complete — ready for backup",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    logApiError("backup-prepare", "Failed to prepare database for backup", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Backup preparation failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
