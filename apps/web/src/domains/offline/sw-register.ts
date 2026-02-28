/**
 * Service Worker Registration
 *
 * Handles SW lifecycle: registration, update detection, skipWaiting on user confirm (FR-308).
 * Emits custom events for UI to show update prompt.
 *
 * Bounded context: offline domain
 */

// --- Types ---

export interface SwUpdateEventDetail {
  type: "update-available" | "update-activated"
}

// --- Registration ---

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.info("[sw-register] Service workers not supported")
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      type: "module",
    })

    // Check for SW updates every 60s. This is a tradeoff:
    // - Lower = faster update detection, more battery/network usage
    // - Higher = slower update detection, less resource usage
    // 60s balances user experience with PWA best practices.
    setInterval(() => {
      registration.update().catch(() => {
        // Silent fail — update check is best-effort
      })
    }, 60_000)

    // Listen for new SW waiting (update available)
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          // New version available — prompt user (FR-308: don't auto-skipWaiting)
          window.dispatchEvent(
            new CustomEvent<SwUpdateEventDetail>("meitheal-sw-update", {
              detail: { type: "update-available" },
            })
          )
        }
      })
    })

    // Listen for controller change (activation complete)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.dispatchEvent(
        new CustomEvent<SwUpdateEventDetail>("meitheal-sw-update", {
          detail: { type: "update-activated" },
        })
      )
    })

    return registration
  } catch (error) {
    console.error("[sw-register] Registration failed:", error)
    return null
  }
}

/**
 * Send skipWaiting message to waiting SW — only call on user confirmation.
 */
export async function activateWaitingSw(): Promise<void> {
  const registration = await navigator.serviceWorker?.getRegistration()
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" })
  }
}
