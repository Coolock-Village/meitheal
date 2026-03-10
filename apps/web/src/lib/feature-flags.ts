/**
 * Feature Flags — Central registry for optional features
 *
 * @domain tasks (cross-cutting)
 * @bounded-context settings
 *
 * Each feature can be toggled on/off via the Settings UI.
 * State is persisted in the `settings` SQLite KV store with
 * keys in the format `feature_<name>`.
 *
 * Server-side: `getFeatureFlags()` reads from DB (used in Astro frontmatter)
 * Client-side: `window.__featureFlags` injected by Layout.astro via define:vars
 *
 * @kcs Adding a new feature toggle:
 * 1. Add entry to FEATURE_DEFAULTS below
 * 2. Guard the feature in UI (Astro pages) and API routes
 * 3. The settings UI auto-discovers features from this registry
 */

import { SettingsRepository } from "@domains/tasks/persistence/settings-repository"
import { ensureSchema, getPersistenceClient } from "@domains/tasks/persistence/store"

/** Feature definition with metadata for the settings UI */
export interface FeatureDefinition {
  /** Default enabled state for new installs */
  default: boolean
  /** Category for grouping in settings UI */
  category: "productivity" | "integrations" | "visual"
  /** Human-readable label */
  label: string
  /** Short description for settings UI */
  description: string
  /** Icon for settings UI (emoji) */
  icon: string
}

/** All toggleable features — single source of truth */
export const FEATURE_DEFAULTS: Record<string, FeatureDefinition> = {
  gamification: {
    default: true,
    category: "productivity",
    label: "Gamification",
    description: "XP points, streaks, levels, achievements, and the gamification dashboard",
    icon: "🏆",
  },
  pomodoro: {
    default: true,
    category: "productivity",
    label: "Pomodoro Timer",
    description: "Focus timer with work/break intervals and time tracking per task",
    icon: "⏱️",
  },
  habits: {
    default: true,
    category: "productivity",
    label: "Habit Tracker",
    description: "Daily habit tracking with streaks and completion history",
    icon: "🔁",
  },
  nfc: {
    default: true,
    category: "integrations",
    label: "NFC Tag Completion",
    description: "Complete tasks by scanning physical NFC tags",
    icon: "📱",
  },
  confetti: {
    default: true,
    category: "visual",
    label: "Confetti Celebration",
    description: "Visual confetti animation when completing tasks",
    icon: "🎉",
  },
  nlp_parser: {
    default: true,
    category: "productivity",
    label: "Smart Task Parsing",
    description: "Extract dates, priorities, labels, and assignees from natural language task titles",
    icon: "🧠",
  },
} as const

/** Resolved feature flag state */
export type FeatureFlags = Record<string, boolean>

/** Get all feature flags (server-side — reads from DB) */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  try {
    await ensureSchema()
    const repo = new SettingsRepository(getPersistenceClient())
    await repo.ensureSettingsTable()

    const featureKeys = Object.keys(FEATURE_DEFAULTS).map((k) => `feature_${k}`)
    const stored = await repo.getByKeys(featureKeys)

    const flags: FeatureFlags = {}
    for (const [name, def] of Object.entries(FEATURE_DEFAULTS)) {
      const key = `feature_${name}`
      if (key in stored) {
        flags[name] = Boolean(stored[key])
      } else {
        flags[name] = def.default
      }
    }
    return flags
  } catch {
    // Fallback: all defaults (safe degradation)
    const flags: FeatureFlags = {}
    for (const [name, def] of Object.entries(FEATURE_DEFAULTS)) {
      flags[name] = def.default
    }
    return flags
  }
}

/** Check if a single feature is enabled (server-side) */
export async function isFeatureEnabled(name: string): Promise<boolean> {
  const flags = await getFeatureFlags()
  return flags[name] ?? FEATURE_DEFAULTS[name]?.default ?? true
}
