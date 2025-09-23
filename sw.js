const CACHE = "skf5s-rettifica-v1";
const CORE = [
  "./",
  "index.html",
  "checklist.html",
  "style.css",
  "app.js",
  "manifest.json",
  "assets/skf-logo.png",
  "assets/5s-hero.png",
  "assets/pwa-192.png",
  "assets/pwa-512.png"
];

self.addEventListener("install",(e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
});
self.addEventListener("activate",(e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE&&caches.delete(k)))));
});
self.addEventListener("fetch",(e)=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
      if(e.request.method==="GET"){
        const copy = resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request, copy));
      }
      return resp;
    }).catch(()=>caches.match("index.html")))
  );
});
