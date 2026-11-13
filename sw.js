/* IronLog service worker — deliberately minimal.
   It caches ICONS ONLY. index.html is never cached, so an upload to GitHub
   always shows up on the next load instead of being served from a stale cache. */
const CACHE = 'ironlog-icons-v8';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled([
        './icons/icon-192.png', './icons/icon-512.png',
        './icons/maskable-192.png', './icons/maskable-512.png',
        './icons/apple-touch-icon.png', './icons/favicon-32.png'
      ].map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (!url.pathname.includes('/icons/')) return;      // HTML and JS always from the network
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
