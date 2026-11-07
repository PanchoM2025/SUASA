// SUASapp Service Worker
// Estrategia: network-first para navegación (HTML), offline fallback desde caché
// 20261106: el fallback sin señal ignora los "?_v=..." de la dirección y, si no
// encuentra esa página exacta, usa cualquier copia guardada de la app.
// 20261107: con señal débil, si el servidor no contesta en 5 segundos abre la
// copia guardada. Al actualizarse borra solo sus propias copias viejas
// (antes borraba también las de Ryder y Lobito, que están en el mismo sitio).

const CACHE = 'suasa-cache-v2';
const PAGES = ['/SUASA/', '/SUASA/index.html', '/SUASA/Aguante_SUASA.html'];
const NET_TIMEOUT = 5000;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(PAGES.map(u => c.add(u).catch(() => {})))
  ));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(k => k.startsWith('suasa-') && k !== CACHE)
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function offlinePage(req) {
  return caches.open(CACHE).then(c =>
    c.match(req, { ignoreSearch: true })
      .then(r => r || c.match('/SUASA/Aguante_SUASA.html'))
      .then(r => r || c.match('/SUASA/index.html'))
      .then(r => r || c.match('/SUASA/'))
  );
}

self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;   // otros recursos: normal
  // HTML: trae del server y actualiza la copia; sin señal o lento, usa la copia
  const net = fetch(e.request, { cache: 'no-cache' }).then(r => {
    if (r && r.ok) {
      const copy = r.clone();
      const url = new URL(e.request.url);
      const p = caches.open(CACHE).then(c => c.put(url.origin + url.pathname, copy)).catch(() => {});
      try { e.waitUntil(p); } catch(err) {}
    }
    return r;
  });
  e.respondWith(new Promise(resolve => {
    let done = false;
    const useCache = () => {
      if (done) return;
      offlinePage(e.request).then(r => {
        if (done) return;
        if (r) { done = true; resolve(r); }
        // sin copia guardada: esperar al servidor
        else net.then(n => { if (!done) { done = true; resolve(n); } },
                      () => { if (!done) { done = true; resolve(Response.error()); } });
      });
    };
    const t = setTimeout(useCache, NET_TIMEOUT);
    net.then(r => { clearTimeout(t); if (!done) { done = true; resolve(r); } },
             () => { clearTimeout(t); useCache(); });
  }));
});
