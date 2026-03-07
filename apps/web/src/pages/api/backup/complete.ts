/**
 * POST /api/backup/complete — Post-backup signal
 *
 * Called by HA Supervisor's backup_post script after snapshot completes.
 * Currently a no-op acknowledgement — the addon can resume normal WAL
 * writes immediately. Exists for symmetry and future use (e.g. rotating
 * backup metrics, triggering post-backup verification).
 *
 * @see https://developers.home-assistant.io/docs/add-ons/configuration#optional-configuration-options
 * Bounded Context: Infrastructure (backup)
 */
import type { APIRoute } from "astro";
import { apiLogger } from "../../../lib/api-logger";

export const POST: APIRoute = async () => {
  apiLogger.log("info", {
    event: "api.backup.complete",
    domain: "backup",
    component: "backup-complete",
    request_id: "supervisor",
    message: "Backup snapshot complete — normal operations resumed",
  });

  return new Response(
    JSON.stringify({
      ok: true,
      message: "Backup complete acknowledged",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
