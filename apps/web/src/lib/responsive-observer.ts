/**
 * Responsive Observer — ResizeObserver for adaptive layout
 *
 * Watches container width and dispatches breakpoint events.
 * Used by sidebar to auto-collapse on narrow viewports.
 *
 * Bounded context: lib (cross-domain utility)
 */

export type BreakpointSize = "compact" | "medium" | "wide"

interface BreakpointConfig {
  compact: number
  medium: number
}

const DEFAULT_CONFIG: BreakpointConfig = { compact: 640, medium: 1024 }

function classify(width: number, config: BreakpointConfig): BreakpointSize {
  if (width < config.compact) return "compact"
  if (width < config.medium) return "medium"
  return "wide"
}

export function observeBreakpoint(
  element: HTMLElement,
  callback: (size: BreakpointSize, width: number) => void,
  config: BreakpointConfig = DEFAULT_CONFIG,
): () => void {
  if (typeof ResizeObserver === "undefined") {
    callback(classify(element.clientWidth, config), element.clientWidth)
    return () => {}
  }

  let lastSize: BreakpointSize | null = null

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = entry.contentRect.width
      const size = classify(width, config)
      if (size !== lastSize) {
        lastSize = size
        callback(size, width)
      }
    }
  })

  observer.observe(element)
  return () => observer.disconnect()
}

export function initResponsiveSidebar(): () => void {
  const mainContent = document.querySelector(".main-content") as HTMLElement
  const sidebar = document.getElementById("sidebar")
  if (!mainContent || !sidebar) return () => {}

  return observeBreakpoint(mainContent, (size) => {
    if (size === "compact") {
      sidebar.classList.add("collapsed")
      sidebar.classList.remove("open")
    } else {
      sidebar.classList.remove("collapsed")
    }
  })
}
