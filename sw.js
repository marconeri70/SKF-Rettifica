const CACHE = "skf5s-v1";
const ASSETS = [
  "./","./index.html","./checklist.html",
  "./style.css","./app.js",
  "./assets/skf-logo.png","./assets/5s-hero.png",
  "./manifest.json"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE&&caches.delete(k)))));
});
self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match("./")))
  );
});
