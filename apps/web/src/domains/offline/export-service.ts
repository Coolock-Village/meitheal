/**
 * Export Service
 *
 * Provides client-side utilities for exporting task data to JSON and CSV formats.
 * Bounded context: offline / tasks
 */

import { getAllTasks, type OfflineTask } from "./offline-store";

export async function exportTasksAsJson(): Promise<void> {
    const tasks = await getAllTasks();
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    triggerDownload(blob, `meitheal-tasks-${new Date().toISOString().split("T")[0]}.json`);
}

export async function exportTasksAsCsv(): Promise<void> {
    const tasks = await getAllTasks();

    if (tasks.length === 0) {
        alert("No tasks to export.");
        return;
    }

    // Define headers based on OfflineTask schema
    const headers = [
        "id", "title", "status", "priority", "taskType", "dueDate",
        "timeTracked", "createdAt", "updatedAt"
    ];

    // Helper to escape CSV values
    const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return `"${str}"`;
    };

    const rows = tasks.map(t => [
        escapeCsv(t.id),
        escapeCsv(t.title),
        escapeCsv(t.status),
        escapeCsv((t as any).priority),
        escapeCsv((t as any).taskType || (t as any).task_type || "task"),
        escapeCsv(t.dueDate),
        escapeCsv((t as any).timeTracked || (t as any).time_tracked),
        escapeCsv(t.createdAt),
        escapeCsv(t.updatedAt)
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, `meitheal-tasks-${new Date().toISOString().split("T")[0]}.csv`);
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
