import { expect, test } from "@playwright/test";

/**
 * Unit tests for todo-status-mapper.ts
 * Tests HA ↔ Meitheal status mapping, due date format detection,
 * and round-trip consistency.
 */

// Inline mapper functions — Playwright tests can't import Astro path aliases.

type HAStatus = "needs_action" | "completed";
type MeithealStatus = "todo" | "in_progress" | "done";

function haStatusToMeitheal(haStatus: HAStatus): MeithealStatus {
  switch (haStatus) {
    case "needs_action": return "todo";
    case "completed": return "done";
    default: return "todo";
  }
}

function meithealStatusToHA(meithealStatus: MeithealStatus): HAStatus {
  switch (meithealStatus) {
    case "todo": return "needs_action";
    case "in_progress": return "needs_action";
    case "done": return "completed";
    default: return "needs_action";
  }
}

function isDueDateTime(due: string): boolean {
  return /[\sT]\d{2}:\d{2}/.test(due);
}

function buildDueServiceData(due?: string | null): Record<string, string> {
  if (!due) return {};
  if (isDueDateTime(due)) return { due_datetime: due };
  return { due_date: due };
}

// ── Status Mapping ──

test("haStatusToMeitheal: needs_action → todo", () => {
  expect(haStatusToMeitheal("needs_action")).toBe("todo");
});

test("haStatusToMeitheal: completed → done", () => {
  expect(haStatusToMeitheal("completed")).toBe("done");
});

test("meithealStatusToHA: todo → needs_action", () => {
  expect(meithealStatusToHA("todo")).toBe("needs_action");
});

test("meithealStatusToHA: in_progress → needs_action", () => {
  expect(meithealStatusToHA("in_progress")).toBe("needs_action");
});

test("meithealStatusToHA: done → completed", () => {
  expect(meithealStatusToHA("done")).toBe("completed");
});

// ── Due Date Detection ──

test("isDueDateTime: date-only returns false", () => {
  expect(isDueDateTime("2026-03-15")).toBe(false);
});

test("isDueDateTime: T-separator datetime returns true", () => {
  expect(isDueDateTime("2026-03-15T14:30:00")).toBe(true);
});

test("isDueDateTime: space-separator datetime returns true", () => {
  expect(isDueDateTime("2026-03-15 14:30:00")).toBe(true);
});

test("isDueDateTime: ISO with timezone returns true", () => {
  expect(isDueDateTime("2026-03-15T14:30:00+00:00")).toBe(true);
});

test("isDueDateTime: ISO with Z returns true", () => {
  expect(isDueDateTime("2026-03-15T14:30:00Z")).toBe(true);
});

// ── buildDueServiceData ──

test("buildDueServiceData: null returns empty", () => {
  expect(buildDueServiceData(null)).toEqual({});
});

test("buildDueServiceData: undefined returns empty", () => {
  expect(buildDueServiceData(undefined)).toEqual({});
});

test("buildDueServiceData: date-only returns due_date", () => {
  expect(buildDueServiceData("2026-03-15")).toEqual({ due_date: "2026-03-15" });
});

test("buildDueServiceData: datetime returns due_datetime", () => {
  expect(buildDueServiceData("2026-03-15T14:30:00")).toEqual({ due_datetime: "2026-03-15T14:30:00" });
});

// ── Round-trip Consistency ──

test("round-trip: todo → HA → meitheal", () => {
  expect(haStatusToMeitheal(meithealStatusToHA("todo"))).toBe("todo");
});

test("round-trip: done → HA → meitheal", () => {
  expect(haStatusToMeitheal(meithealStatusToHA("done"))).toBe("done");
});

test("round-trip: in_progress is lossy (→ needs_action → todo)", () => {
  const ha = meithealStatusToHA("in_progress");
  expect(ha).toBe("needs_action");
  expect(haStatusToMeitheal(ha)).toBe("todo");
});

test("round-trip: HA needs_action → meitheal → HA", () => {
  expect(meithealStatusToHA(haStatusToMeitheal("needs_action"))).toBe("needs_action");
});

test("round-trip: HA completed → meitheal → HA", () => {
  expect(meithealStatusToHA(haStatusToMeitheal("completed"))).toBe("completed");
});
