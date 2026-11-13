/* IronLog service worker — app shell precache + exercise photo runtime cache. */
const SHELL = 'ironlog-shell-v1';
const PHOTOS = 'ironlog-photos-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-192.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL)
      .then((c) => Promise.allSettled(ASSETS.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== SHELL && k !== PHOTOS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // never cache API writes
  const url = new URL(req.url);
  if (url.hostname === 'script.google.com') return;       // never cache the data API

  // Exercise photography: cache-first, it never changes.
  if (url.hostname === 'raw.githubusercontent.com') {
    e.respondWith(
      caches.open(PHOTOS).then((c) =>
        c.match(req).then((hit) =>
          hit || fetch(req).then((res) => {
            if (res && res.status === 200) c.put(req, res.clone());
            return res;
          }).catch(() => hit)
        )
      )
    );
    return;
  }

  // App shell: cache-first, refresh in the background.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200 && (url.origin === location.origin || url.hostname === 'cdnjs.cloudflare.com')) {
          caches.open(SHELL).then((c) => c.put(req, res.clone()));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
