const CACHE_NAME = "meintraum-v1"

// Statische Assets die offline verfügbar sein sollen
const STATIC_ASSETS = [
  "/",
  "/entry",
  "/dashboard",
  "/offline",
]

// Install: Cache statische Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Einzelne Fehler ignorieren – App läuft trotzdem
      })
    })
  )
  self.skipWaiting()
})

// Activate: Alte Caches löschen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch: Network-first für API, Cache-first für Assets
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API-Calls immer live (kein Cache)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: "Offline" }), {
          headers: { "Content-Type": "application/json" },
        })
      })
    )
    return
  }

  // Supabase-Calls immer live
  if (url.hostname.includes("supabase")) {
    event.respondWith(fetch(request))
    return
  }

  // Alles andere: Network-first, Fallback auf Cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Erfolgreiche Antwort in Cache schreiben
        if (response.ok && request.method === "GET") {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        // Aus Cache laden wenn offline
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // Offline-Fallback für Navigation
          if (request.mode === "navigate") {
            return caches.match("/offline")
          }
          return new Response("Offline", { status: 503 })
        })
      })
  )
})

// Push Notifications (für später – Android)
self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || "MeinTraum", {
      body: data.body || "Zeit deinen Traum festzuhalten 🌙",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/entry" },
    })
  )
})

// Notification click → App öffnen
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/entry"
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})
