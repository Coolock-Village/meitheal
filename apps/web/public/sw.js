/**
 * Service Worker — Meitheal PWA
 *
 * Cache-first for static assets, network-first for API routes.
 * Offline fallback for navigation requests.
 * Background sync trigger for pending operations.
 * skipWaiting requires client message (FR-308).
 */

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = "meitheal-v1"
const SYNC_TAG = "meitheal-background-sync"

// Static assets to precache (app shell)
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
]

// --- Install ---

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
})

// --- Activate ---

self.addEventListener("activate", (event: ExtendableEvent) => {
  // Clean old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// --- Fetch ---

self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url)

  // API routes: network-first with offline queue
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(event.request))
    return
  }

  // Navigation: network-first with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(navigationHandler(event.request))
    return
  }

  // Static assets: cache-first
  event.respondWith(cacheFirst(event.request))
})

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" })
  }
}

async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    })
  }
}

async function navigationHandler(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    // Cache successful navigation for offline access
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Serve cached version or offline fallback
    const cached = await caches.match(request)
    if (cached) return cached

    const offlinePage = await caches.match("/offline")
    if (offlinePage) return offlinePage

    return new Response("Offline", { status: 503 })
  }
}

// --- Background Sync ---

self.addEventListener("sync", (event: ExtendableEvent & { tag?: string }) => {
  if (event.tag === SYNC_TAG) {
    // Sync engine handles the actual processing via client messaging
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "SYNC_TRIGGERED" })
        }
      })
    )
  }
})

// --- Message Handler (skipWaiting from client) ---

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
