// ─── Service Worker (App Shell Cache) ────────────────────────────────────────
// Caches the Vite-built app shell (HTML, JS, CSS) so WeeklyOS loads offline.
// Uses a Cache-First strategy for static assets and Network-First for API calls.
//
// Registration: See vite.config.ts and index.html (or App.tsx) where
// navigator.serviceWorker.register('/sw.js') is called.

const CACHE_NAME = 'weeklyos-shell-v1'

// Static assets to pre-cache on install.
// Vite generates hashed filenames; we cache the root and let the fetch handler
// pick up the rest dynamically.
const PRE_CACHE_URLS = [
  '/',
  '/index.html',
]

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE_URLS))
  )
  // Activate immediately — don't wait for existing tabs to close.
  self.skipWaiting()
})

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Let Supabase API calls, auth, and realtime go directly to the network.
  // Caching these would cause stale authentication bugs.
  const isSupabaseApi =
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.io') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/realtime/')

  if (isSupabaseApi || request.method !== 'GET') {
    // Network-only — pass through.
    return
  }

  // App shell (HTML navigation requests) — Network-First with cache fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh response for future offline use.
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() =>
          // Offline — serve the cached index.html so React Router takes over.
          caches.match('/index.html').then(
            (cached) => cached ?? new Response('Offline', { status: 503 })
          )
        )
    )
    return
  }

  // Static assets (JS, CSS, images, fonts) — Cache-First.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => new Response('', { status: 503 }))
    })
  )
})
