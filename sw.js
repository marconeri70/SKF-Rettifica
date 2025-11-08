// sw.js — v5 (cache bust + update forzato)
const CACHE = 'skf5s-v5';
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
  // Prendi subito il controllo alla nuova versione
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // network-first per HTML e JS, cache-first per il resto
  const isDoc = req.destination === 'document';
  const isJS  = req.url.endsWith('.js');

  if (isDoc || isJS) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    e.respondWith(caches.match(req).then((res) => res || fetch(req)));
  }
});
