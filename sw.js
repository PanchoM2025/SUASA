// SUASapp Service Worker
// Estrategia: network-first para navegación (HTML), offline fallback desde caché

const CACHE = 'suasa-cache-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.add('/SUASA/')));
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    // HTML: siempre trae del server, actualiza caché, fallback offline
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(r => {
          caches.open(CACHE).then(c => c.put(e.request, r.clone()));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
  }
  // Otros recursos: comportamiento normal del browser
});