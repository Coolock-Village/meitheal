/**
 * CalDAV Credentials API — Encrypted credential management
 *
 * POST — save/test CalDAV credentials
 * GET  — check if credentials exist (never returns password)
 * DELETE — remove credentials
 *
 * Passwords are encrypted at rest using AES-256-GCM with a key
 * derived from SUPERVISOR_TOKEN (or fallback for dev).
 *
 * @domain calendar
 * @bounded-context integration
 */
import type { APIRoute } from "astro";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store";
import { testConnection } from "@domains/calendar/caldav-client";

// ─── Encryption Helpers ─────────────────────────────────────────────

const ALGO = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;

/** Derive a 32-byte key from SUPERVISOR_TOKEN (or fallback for dev) */
function deriveKey(): Buffer {
  const secret = process.env.SUPERVISOR_TOKEN || process.env.HA_TOKEN || "meitheal-dev-fallback-key";
  return scryptSync(secret, "meitheal-caldav-salt", 32);
}

function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: base64(iv + tag + ciphertext)
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/** @internal — exported for bridge sync use only */
export function decryptCalDAVPassword(encoded: string): string {
  const key = deriveKey();
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, IV_LEN);
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = raw.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}

// ─── API Routes ─────────────────────────────────────────────────────

/**
 * GET — check if CalDAV credentials are configured
 * Returns { configured: boolean, url?: string, username?: string }
 * NEVER returns the password.
 */
export const GET: APIRoute = async () => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();

    const res = await client.execute({
      sql: "SELECT key, value FROM settings WHERE key IN ('caldav_url', 'caldav_username', 'caldav_password_enc') ORDER BY key",
      args: [],
    });

    const settings: Record<string, string> = {};
    for (const row of res.rows) {
      settings[String(row.key)] = String(row.value);
    }

    return new Response(JSON.stringify({
      ok: true,
      configured: !!(settings.caldav_url && settings.caldav_password_enc),
      url: settings.caldav_url || null,
      username: settings.caldav_username || null,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[caldav-credentials] GET failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

/**
 * POST — save or test CalDAV credentials
 * Body: { action: "save" | "test", url, username, password }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    let body: { action?: "save" | "test"; url?: string; username?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { url, username, password } = body;
    if (!url || !username || !password) {
      return new Response(
        JSON.stringify({ ok: false, error: "url, username, and password are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const action = body.action ?? "save";

    if (action === "test") {
      const result = await testConnection({ url, username, password });
      return new Response(JSON.stringify(result), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }

    // Save: encrypt password and store
    await ensureSchema();
    const client = getPersistenceClient();
    const now = Date.now();
    const encryptedPassword = encrypt(password);

    await client.batch([
      {
        sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        args: ["caldav_url", url, now],
      },
      {
        sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        args: ["caldav_username", username, now],
      },
      {
        sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        args: ["caldav_password_enc", encryptedPassword, now],
      },
    ]);

    return new Response(JSON.stringify({
      ok: true, message: "CalDAV credentials saved securely",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[caldav-credentials] POST failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

/**
 * DELETE — remove CalDAV credentials
 */
export const DELETE: APIRoute = async () => {
  try {
    await ensureSchema();
    const client = getPersistenceClient();

    await client.batch([
      { sql: "DELETE FROM settings WHERE key = 'caldav_url'", args: [] },
      { sql: "DELETE FROM settings WHERE key = 'caldav_username'", args: [] },
      { sql: "DELETE FROM settings WHERE key = 'caldav_password_enc'", args: [] },
    ]);

    return new Response(JSON.stringify({
      ok: true, message: "CalDAV credentials removed",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[caldav-credentials] DELETE failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
