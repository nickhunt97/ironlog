/* IronLog service worker — caches the installable shell only.
   The app itself is served by Google inside the frame and is not cacheable. */
const SHELL = 'ironlog-shell-v6';
const ASSETS = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/maskable-192.png',
  './icons/maskable-512.png','./icons/apple-touch-icon.png','./icons/favicon-32.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL)
    .then((c) => Promise.allSettled(ASSETS.map((u) => c.add(u))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
