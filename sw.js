// Disabilitato per evitare cache vecchie
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});
