/**
 * Service Worker — Meitheal PWA
 *
 * Cache-first for static assets, network-first for API routes.
 * Offline fallback for navigation requests.
 * Background sync trigger for pending operations.
 * Push notification handler for task reminders.
 * skipWaiting requires client message (FR-308).
 */

/**
 * Cache version — bump on each release to invalidate stale precache.
 * The activate handler (below) automatically deletes old cache keys
 * that don't match CACHE_NAME, so incrementing this is sufficient.
 *
 * @kcs Keep in sync with meitheal-hub/config.yaml version.
 */
const CACHE_VERSION = "0.1.21";
const CACHE_NAME = `meitheal-v${CACHE_VERSION}`;
const SYNC_TAG = "meitheal-background-sync";

// Static assets to precache (app shell + key pages)
// Astro's Vite build adds content hashes to JS/CSS filenames automatically.
// These page URLs are cache-busted by CACHE_VERSION above.
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/today",
  "/tasks",
  "/kanban",
  "/table",
  "/calendar",
  "/settings",
  "/manifest.webmanifest",
  "/icon-192.png",
];

// --- Install ---

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// --- Activate ---

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// --- Fetch ---

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (POST/PUT/DELETE go straight to network)
  if (event.request.method !== "GET") return;

  // Ignore non-http/https requests (e.g. chrome-extension://)
  if (!url.protocol.startsWith("http")) return;

  // API routes: network-first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Navigation: network-first with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(navigationHandler(event.request));
    return;
  }

  // Static assets: cache-first
  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    const offlinePage = await caches.match("/offline");
    if (offlinePage) return offlinePage;

    return new Response("Offline", { status: 503 });
  }
}

// --- Background Sync ---

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "SYNC_TRIGGERED" });
        }
      })
    );
  }
});

// --- Push Notifications ---

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {
    title: "Meitheal",
    body: "You have a notification",
    url: "/",
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Meitheal", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "meitheal-push",
      data: { url: data.url || "/" },
      requireInteraction: data.requireInteraction || false,
    })
  );
});

// --- Notification Click ---

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// --- Message Handler (skipWaiting from client) ---

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
