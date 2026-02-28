/**
 * Export Service
 *
 * Provides client-side utilities for exporting task data to JSON and CSV formats.
 * Bounded context: offline / tasks
 */

import { getAllTasks } from "./offline-store";
import { getAttachmentsByTaskId } from "./offline-store";

export async function exportLocalDataAsJson(): Promise<void> {
    const tasks = await getAllTasks();
    const payload = [];

    for (const task of tasks) {
        const attachments = await getAttachmentsByTaskId(task.id);
        payload.push({
            ...task,
            _attachments: attachments.map(a => ({
                id: a.id,
                filename: a.filename,
                mimeType: a.mimeType,
                base64Data: a.base64Data,
                createdAt: a.createdAt
            }))
        });
    }

    const dataStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    triggerDownload(blob, `meitheal-local-export-${new Date().toISOString().split("T")[0]}.json`);
}

function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
