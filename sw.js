// Five & Dive Command Center — Service Worker
// v22.86 — Social & Content tab + Team Space
//
// RULE: bump CACHE every time index.html changes. Keep in lockstep with the
// two version badges in index.html.

const CACHE = 'fd-cc-v2286';

const CORE = [
  './',
  './index.html'
];

// Hosts we must NEVER intercept — always hit the live network (backend + CDNs).
const BYPASS_HOSTS = [
  'jsdelivr.net',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'googleapis.com',
  'gstatic.com',
  'workers.dev'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always bypass non-GET and bypass hosts
  if (event.request.method !== 'GET') return;
  if (BYPASS_HOSTS.some(h => url.hostname.includes(h))) return;

  event.respondWith(
    fetch(event.request).then((response) => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
