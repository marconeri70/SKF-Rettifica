self.addEventListener("install", e => {
  e.waitUntil(caches.open("v1k-cache").then(cache => cache.addAll([
    "/", "/index.html", "/checklist.html", "/style.v1k.css", "/app.v1k.js"
  ])));
});
self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
