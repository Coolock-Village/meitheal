/**
 * Connectivity Detector
 *
 * Combines navigator.onLine with periodic health check pings.
 * Debounces state transitions (2s) to prevent flicker.
 * Emits custom events for UI components and sync engine.
 *
 * Bounded context: offline domain
 */

// --- Types ---

export type ConnectivityState = "online" | "offline" | "checking"

export interface ConnectivityEventDetail {
  state: ConnectivityState
  previousState: ConnectivityState
}

// --- Configuration ---

const HEALTH_CHECK_URL = "/api/health"
const HEALTH_CHECK_INTERVAL_MS = 30_000
const DEBOUNCE_MS = 2_000

// --- State ---

let currentState: ConnectivityState = typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline"
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let healthCheckTimer: ReturnType<typeof setInterval> | null = null

function emit(state: ConnectivityState, previousState: ConnectivityState): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<ConnectivityEventDetail>("meitheal-connectivity", {
        detail: { state, previousState },
      })
    )
  }
}

function transitionTo(newState: ConnectivityState): void {
  if (newState === currentState) return

  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    const previousState = currentState
    currentState = newState
    emit(currentState, previousState)
  }, DEBOUNCE_MS)
}

async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5_000)
    const response = await fetch(HEALTH_CHECK_URL, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

// --- Public API ---

export function getConnectivityState(): ConnectivityState {
  return currentState
}

export function startConnectivityMonitor(): void {
  if (typeof window === "undefined") return

  // Listen to browser online/offline events
  window.addEventListener("online", () => {
    transitionTo("checking")
    checkHealth().then((ok) => transitionTo(ok ? "online" : "offline"))
  })

  window.addEventListener("offline", () => {
    transitionTo("offline")
  })

  // Periodic health check (skip when tab is backgrounded to save bandwidth)
  healthCheckTimer = setInterval(async () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return
    if (navigator.onLine) {
      const ok = await checkHealth()
      if (!ok && currentState === "online") {
        transitionTo("offline")
      } else if (ok && currentState === "offline") {
        transitionTo("online")
      }
    }
  }, HEALTH_CHECK_INTERVAL_MS)
}

export function stopConnectivityMonitor(): void {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer)
    healthCheckTimer = null
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}
