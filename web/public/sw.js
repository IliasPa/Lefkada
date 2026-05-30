const CACHE_NAME = 'lefkada-v1.3';

// Only cache truly immutable static assets — NEVER the HTML shell
const PRECACHE = [
  '/PegasusFlag.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete ALL old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // NEVER serve HTML from cache — always fetch fresh
  if (request.destination === 'document' || url.pathname === '/') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // Next.js JS/CSS chunks have content-hash in URL → cache-first is safe
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached ?? fetch(request).then((res) => {
          if (res.ok) {
            caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          }
          return res;
        })
      )
    );
    return;
  }

  // Everything else: network first, cache as fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
