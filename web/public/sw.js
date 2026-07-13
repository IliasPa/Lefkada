const CACHE_NAME = 'lefkada-v1.5';

// Web-push messages sent by the municipality (see /admin ▸ Ειδοποιήσεις).
self.addEventListener('push', (event) => {
  let payload = { title: 'Δήμος Λευκάδος', body: '', url: '/' };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch (e) {
    payload.body = event.data ? event.data.text() : '';
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/PegasusFlag.png',
      badge: '/PegasusFlag.png',
      tag: 'lefkada-push',
      renotify: true,
      data: { url: payload.url || '/' },
    })
  );
});

// Open the app/website when a risk-alert notification is tapped.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const c of clients) {
          if ('focus' in c) {
            c.navigate(url);
            return c.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});

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
