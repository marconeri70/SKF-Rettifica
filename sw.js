const CACHE = 'skf5s-v1k-ch24';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.v1k.js',
  './manifest.json',
  './assets/skf-192.png',
  './assets/skf-512.png',
  './assets/5s-hero.png',
  './assets/5S.png',
  './assets/skf-logo.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
});

self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(r=> r || fetch(e.request))
  );
});
