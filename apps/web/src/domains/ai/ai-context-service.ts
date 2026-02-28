/**
 * AI Context Service
 *
 * Generates deterministic LLM prompts from task payloads and routes the user
 * to their configured AI provider (ChatGPT, Claude, Gemini, or Custom).
 *
 * Bounded Context: ai / tasks
 */

import { getTask } from "../offline/offline-store";

export async function askAIForTask(taskId: string): Promise<void> {
    const task = await getTask(taskId);
    if (!task) {
        throw new Error(`Task ${taskId} not found in local store.`);
    }

    // 1. Fetch configured provider
    let provider = "chatgpt";
    let customUrl = "";
    try {
        const res = await fetch("/api/settings?key=ai-provider");
        if (res.ok) {
            const data = await res.json();
            if (data && data.value) provider = data.value;
        }
        const resUrl = await fetch("/api/settings?key=ai-custom-url");
        if (resUrl.ok) {
            const dataUrl = await resUrl.json();
            if (dataUrl && dataUrl.value) customUrl = dataUrl.value;
        }
    } catch (err) {
        console.warn("Failed to fetch AI provider settings, defaulting to ChatGPT", err);
    }

    // 2. Construct deterministic prompt
    const type = (task as any).taskType || (task as any).task_type || "Task";
    const prompt = `I am working on the following ${type} in my local Meitheal system. I need help planning, debugging, or decomposing this piece of work.

## 📋 Context
**Title**: ${task.title}
**Status**: ${task.status}
**Priority**: ${(task as any).priority || "None"}
**Due Date**: ${task.dueDate || "No due date"}

## 📝 Description
${task.description || "No description provided."}

Please act as a senior technical co-pilot and help me break this down into actionable sub-tasks or solve the immediate blocking issues.
`;

    // 3. Write to Clipboard
    try {
        await navigator.clipboard.writeText(prompt);
    } catch (err) {
        console.error("Clipboard write failed:", err);
        throw new Error("Unable to copy context to clipboard.");
    }

    // 4. Route accurately based on provider
    let targetUrl = "https://chatgpt.com/";
    switch (provider) {
        case "claude":
            targetUrl = "https://claude.ai/new";
            break;
        case "gemini":
            targetUrl = "https://gemini.google.com/";
            break;
        case "ollama":
        case "custom":
            targetUrl = customUrl || "http://localhost:11434/";
            break;
    }

    // Deep linking to provider
    window.open(targetUrl, "_blank");
}
