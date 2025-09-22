const CACHE = "skf5s-v1k";
const ASSETS = ["/","/index.html","/checklist.html","/style.v1k.css","/app.v1k.js"];
self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener("fetch", e=>{
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)));
});