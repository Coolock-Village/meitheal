import { test, expect } from "@playwright/test";

/**
 * Offline Image Attachment CRUD Tests (Phase 23)
 *
 * Tests the IndexedDB task_attachments store via page.evaluate()
 * to ensure save, get, and delete attachment operations work correctly.
 */

test.describe("Offline Attachment CRUD", () => {
    test("saveAttachment stores and retrieves by taskId", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const result = await page.evaluate(async () => {
            const { saveAttachment, getAttachmentsByTaskId } = await import(
                "/src/domains/offline/offline-store"
            );

            const attachment = {
                id: crypto.randomUUID(),
                taskId: "test-task-001",
                filename: "test-image.png",
                mimeType: "image/png",
                base64Data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYA",
                createdAt: new Date().toISOString(),
            };

            await saveAttachment(attachment);
            const results = await getAttachmentsByTaskId("test-task-001");

            return {
                count: results.length,
                firstFilename: results[0]?.filename,
                firstMimeType: results[0]?.mimeType,
                hasBase64: !!results[0]?.base64Data,
            };
        });

        expect(result.count).toBe(1);
        expect(result.firstFilename).toBe("test-image.png");
        expect(result.firstMimeType).toBe("image/png");
        expect(result.hasBase64).toBe(true);
    });

    test("deleteAttachment removes from store", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const result = await page.evaluate(async () => {
            const { saveAttachment, getAttachmentsByTaskId, deleteAttachment } =
                await import("/src/domains/offline/offline-store");

            const id = crypto.randomUUID();
            const attachment = {
                id,
                taskId: "test-task-002",
                filename: "delete-me.jpg",
                mimeType: "image/jpeg",
                base64Data: "data:image/jpeg;base64,/9j/4AAQ",
                createdAt: new Date().toISOString(),
            };

            await saveAttachment(attachment);
            const before = await getAttachmentsByTaskId("test-task-002");
            await deleteAttachment(id);
            const after = await getAttachmentsByTaskId("test-task-002");

            return { before: before.length, after: after.length };
        });

        expect(result.before).toBe(1);
        expect(result.after).toBe(0);
    });

    test("getAttachmentsByTaskId returns empty for unknown taskId", async ({
        page,
    }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const result = await page.evaluate(async () => {
            const { getAttachmentsByTaskId } = await import(
                "/src/domains/offline/offline-store"
            );
            const results = await getAttachmentsByTaskId("nonexistent-task-999");
            return results.length;
        });

        expect(result).toBe(0);
    });

    test("multiple attachments for same taskId are all retrieved", async ({
        page,
    }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const result = await page.evaluate(async () => {
            const { saveAttachment, getAttachmentsByTaskId } = await import(
                "/src/domains/offline/offline-store"
            );

            const taskId = "test-task-003";
            for (let i = 0; i < 3; i++) {
                await saveAttachment({
                    id: crypto.randomUUID(),
                    taskId,
                    filename: `image-${i}.png`,
                    mimeType: "image/png",
                    base64Data: `data:image/png;base64,${i}`,
                    createdAt: new Date().toISOString(),
                });
            }

            const results = await getAttachmentsByTaskId(taskId);
            return results.length;
        });

        expect(result).toBe(3);
    });
});

test.describe("Offline Store Metadata", () => {
    test("getDbName returns correct database name", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const name = await page.evaluate(async () => {
            const { getDbName } = await import(
                "/src/domains/offline/offline-store"
            );
            return getDbName();
        });

        expect(name).toBe("meitheal-offline");
    });

    test("getDbVersion returns version 2", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const version = await page.evaluate(async () => {
            const { getDbVersion } = await import(
                "/src/domains/offline/offline-store"
            );
            return getDbVersion();
        });

        expect(version).toBe(2);
    });
});
