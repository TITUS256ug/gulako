const CACHE = 'gulako-v4-shell'

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.add('/'))
      .catch(() => undefined)
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('gulako-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  if (event.request.mode !== 'navigate') return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then(cache => cache.put('/', copy)).catch(() => undefined)
        }
        return response
      })
      .catch(() => caches.match('/'))
  )
})
