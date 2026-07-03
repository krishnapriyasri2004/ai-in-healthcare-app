// Minimal Service Worker to enable PWA installation
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // For a production-ready PWA, we would implement a caching strategy here
  // such as Cache First for static assets and Network First for API calls.
  // For now, we just pass the request through to enable the install prompt.
  event.respondWith(fetch(event.request))
})
