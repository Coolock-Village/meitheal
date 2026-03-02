/**
 * Service Worker Registration — Ingress-Aware
 *
 * Handles SW lifecycle: registration, update detection, skipWaiting on user confirm (FR-308).
 * Emits custom events for UI to show update prompt.
 *
 * When running behind HA Supervisor ingress, uses window.__ingress_path
 * to register the SW at the correct ingress-prefixed URL and scope.
 * The ingress token is permanent per-installation (HA issue #6605).
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
    // Build ingress-aware SW URL and scope.
    // When accessed via HA ingress, window.__ingress_path contains the
    // permanent prefix (e.g. "/api/hassio_ingress/{token}").
    const ip = typeof window !== "undefined" ? (window.__ingress_path ?? "") : ""
    const swUrl = `${ip}/sw.js`
    const swScope = `${ip}/`

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: swScope,
    })

    // Send ingress path to the SW so it can prefix precache URLs
    // and adjust fetch routing accordingly.
    if (ip && registration.active) {
      registration.active.postMessage({ type: "SET_INGRESS_PATH", path: ip })
    }

    // Also send to installing/waiting SW (covers first registration + updates)
    if (ip) {
      const sendIngressPath = (sw: ServiceWorker | null) => {
        if (sw) sw.postMessage({ type: "SET_INGRESS_PATH", path: ip })
      }
      sendIngressPath(registration.installing)
      sendIngressPath(registration.waiting)
    }

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

      // Send ingress path to the new SW as soon as it's installing
      if (ip) {
        newWorker.postMessage({ type: "SET_INGRESS_PATH", path: ip })
      }

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
