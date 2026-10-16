// Keeps the card available offline (meeting rooms, flights, basements).
const CACHE = 'pravin-card-v13';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // The page itself: always try the network first so updates show immediately; fall back to the cache offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) caches.open(CACHE).then((c) => c.put('./index.html', res.clone()));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Icons and manifest: cache first.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
