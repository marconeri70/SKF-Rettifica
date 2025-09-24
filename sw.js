const CACHE = "skf5s-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./checklist.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./assets/pwa-192.png",
  "./assets/pwa-512.png",
  "./assets/skf-logo.png",
  "./assets/5s-hero.png"
];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e)=>{
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(res=> res || fetch(req).then(r=>{
      const copy = r.clone();
      caches.open(CACHE).then(c=> c.put(req, copy));
      return r;
    }).catch(()=> caches.match("./index.html")))
  );
});
