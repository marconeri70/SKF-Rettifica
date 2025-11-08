// sw.js — v6 robust (GitHub Pages, sottocartella)
const CACHE = 'skf5s-v6';
const ASSETS = [
  './',
  './index.html',
  './checklist.html',
  './style.css',
  './app.js',
  './manifest.json',
  './skf-logo.png',
  './5s-hero.png',
  './skf-192.png',
  './skf-512.png',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Network-first per documenti e JS (così prendi gli aggiornamenti)
  const isDoc = req.destination === 'document';
  const isJS  = url.pathname.endsWith('.js');

  if (isDoc || isJS) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first per tutto il resto
  e.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});

// opzionale: messaggi per skipWaiting
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    e.source?.postMessage?.({ type: 'SKIP_WAITING_DONE' });
  }
});
