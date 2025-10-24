const CACHE = "skf5s-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./checklist.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./assets/5s-hero.png",
  "./assets/skf-logo.png",
  "./assets/pwa-192.png",
  "./assets/pwa-512.png"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
});

self.addEventListener("fetch", e=>{
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp=>{
      const copy = resp.clone();
      caches.open(CACHE).then(c=>c.put(req, copy));
      return resp;
    }))
  );
});

// Export normalizzato per Supervisore (JSON v1.0)
(function(){
  const $ = s => document.querySelector(s);

  function getPoints(){
    // ADATTA a come salvi i punteggi in Rettifica
    return {
      s1: Number(window.state?.s1 || 0),
      s2: Number(window.state?.s2 || 0),
      s3: Number(window.state?.s3 || 0),
      s4: Number(window.state?.s4 || 0),
      s5: Number(window.state?.s5 || 0),
    };
  }

  function getNotes(){
    // Accetta array [{s,text,date}] OPPURE oggetto per S {S1:[...], "1S":[...]}
    const raw = window.state?.notes || null;
    const out = [];
    if (!raw) return out;
    if (Array.isArray(raw)) return raw;
    for (const k of Object.keys(raw)){
      const arr = Array.isArray(raw[k]) ? raw[k] : [raw[k]];
      const s = (k.toString().toUpperCase().replace('S','')[0] || '') + 'S';
      for (const item of arr){
        out.push({
          s,
          text: (item?.text || item || '').toString(),
          date: item?.date || new Date().toISOString().slice(0,10)
        });
      }
    }
    return out;
  }

  function exportSupervisor(){
    const area = window.state?.area || "Rettifica";
    const channel = window.state?.channel || "CH ?";
    const rec = [{
      area,
      channel,
      date: new Date().toISOString().slice(0,16),
      points: getPoints(),
      notes: getNotes()
    }];
    const blob = new Blob([JSON.stringify(rec, null, 2)], {type:"application/json"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SKF-5S-${area}-${channel}.json`;
    a.click();
  }

  $('#btn-export-supervisor')?.addEventListener('click', exportSupervisor);
})();
