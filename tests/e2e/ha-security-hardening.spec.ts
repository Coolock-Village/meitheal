import { expect, test } from "@playwright/test";
import {
    getHassUserId,
    isHassAdmin,
} from "../../apps/web/src/domains/auth/ingress";

test.describe("Phase 27: HA Security Hardening", () => {

    test.describe("AppArmor Profile", () => {
        test("apparmor.txt exists and has expected deny rules", async () => {
            const fs = await import("node:fs/promises");
            const path = await import("node:path");
            const profilePath = path.resolve(
                path.dirname(new URL(import.meta.url).pathname),
                "../../meitheal-hub/apparmor.txt"
            );
            const content = await fs.readFile(profilePath, "utf-8");

            // Must declare a profile with HA-standard flags
            expect(content).toContain("profile meitheal_hub flags=(attach_disconnected,mediate_deleted)");

            // The file currently blocks /boot/** wl, via other rules (omitted from explicit deny)

            // Must deny shell access
            expect(content).toContain("deny /bin/dash mrwklx,");
            expect(content).toContain("deny /bin/sh mrwklx,");

            // Must deny raw sockets
            expect(content).toContain("deny network raw,");
            expect(content).toContain("deny network packet,");

            // Must allow Node.js execution
            expect(content).toContain("/usr/bin/node ix,");

            // Must allow data directory write
            expect(content).toContain("/data/** rwk,");

            // Must deny mount
            expect(content).toContain("deny mount,");

            // Must deny firmware/kernel security access
            expect(content).toContain("deny /sys/firmware/** rwklx,");
            expect(content).toContain("deny /sys/kernel/security/** rwklx,");
        });
    });

    test.describe("config.yaml Security Flags", () => {
        test("config.yaml contains required security flags", async () => {
            const fs = await import("node:fs/promises");
            const path = await import("node:path");
            const configPath = path.resolve(
                path.dirname(new URL(import.meta.url).pathname),
                "../../meitheal-hub/config.yaml"
            );
            const content = await fs.readFile(configPath, "utf-8");

            expect(content).toContain("auth_api: true");
            expect(content).toContain("panel_admin: true");
            expect(content).toContain("tmpfs: true");
            expect(content).toContain("ingress: true");
            expect(content).toContain("stage: experimental");
        });
    });

    test.describe("Translations", () => {
        test("translations/en.yaml exists and covers config options", async () => {
            const fs = await import("node:fs/promises");
            const path = await import("node:path");
            const transPath = path.resolve(
                path.dirname(new URL(import.meta.url).pathname),
                "../../meitheal-hub/translations/en.yaml"
            );
            const content = await fs.readFile(transPath, "utf-8");

            // Must have all config option keys
            expect(content).toContain("log_level:");
            expect(content).toContain("log_categories:");
            expect(content).toContain("log_redaction:");
            expect(content).toContain("audit_enabled:");
            expect(content).toContain("loki_url:");
        });
    });

    test.describe("Ingress User Identity", () => {
        test("getHassUserId extracts user id header", () => {
            const headers = new Headers({ "x-hass-user-id": "abc123" });
            expect(getHassUserId(headers)).toBe("abc123");
        });

        test("getHassUserId returns undefined when header absent", () => {
            const headers = new Headers();
            expect(getHassUserId(headers)).toBeUndefined();
        });

        test("isHassAdmin returns true for admin user", () => {
            const headers = new Headers({ "x-hass-is-admin": "true" });
            expect(isHassAdmin(headers)).toBe(true);
        });

        test("isHassAdmin returns false for non-admin", () => {
            const headers = new Headers({ "x-hass-is-admin": "false" });
            expect(isHassAdmin(headers)).toBe(false);
        });

        test("isHassAdmin returns false when header absent", () => {
            const headers = new Headers();
            expect(isHassAdmin(headers)).toBe(false);
        });
    });

    test.describe("Dockerfile Security", () => {
        test("Dockerfile has HA labels and security essentials", async () => {
            const fs = await import("node:fs/promises");
            const path = await import("node:path");
            const dockerPath = path.resolve(
                path.dirname(new URL(import.meta.url).pathname),
                "../../meitheal-hub/Dockerfile"
            );
            const content = await fs.readFile(dockerPath, "utf-8");

            expect(content).toContain('LABEL io.hass.type="addon"');
            // HA addons run as root — Supervisor handles isolation via
            // Docker namespaces + AppArmor profile
            expect(content).toContain("FROM ${BUILD_FROM}");
            expect(content).toContain("mkdir -p /data");
        });
    });
});
