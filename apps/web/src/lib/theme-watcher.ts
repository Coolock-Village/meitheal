/**
 * Theme Watcher — prefers-color-scheme live listener
 *
 * Listens for OS-level theme changes (light/dark/auto) and
 * dispatches a custom event for the app to respond to.
 *
 * Bounded context: lib (cross-domain utility)
 */

export type ThemeMode = "light" | "dark" | "auto"

const STORAGE_KEY = "meitheal-theme"

export function getEffectiveTheme(): "light" | "dark" {
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function setTheme(mode: ThemeMode): void {
  localStorage.setItem(STORAGE_KEY, mode)
  applyTheme()
}

function applyTheme(): void {
  const theme = getEffectiveTheme()
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.classList.toggle("light", theme === "light")
  const metaTheme = document.querySelector('meta[name="theme-color"]')
  if (metaTheme) {
    metaTheme.setAttribute("content", theme === "dark" ? "#1a1a2e" : "#ffffff")
  }
}

export function initThemeWatcher(): void {
  applyTheme()
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  mq.addEventListener("change", () => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (!stored || stored === "auto") {
      applyTheme()
      window.dispatchEvent(new CustomEvent("meitheal:theme-changed", {
        detail: { theme: getEffectiveTheme() },
      }))
    }
  })
}
