// sw.js — v5
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
  const { request } = e;
  // network-first per HTML/JS, cache-first per asset statici
  if (request.destination === 'document' || request.url.endsWith('.js')) {
    e.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      }).catch(() => caches.match(request))
    );
  } else {
    e.respondWith(caches.match(request).then((res) => res || fetch(request)));
  }
});
