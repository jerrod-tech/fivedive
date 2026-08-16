// Five & Dive Command Center — Service Worker
// v22.97 — Daily Intake simplified to ONE dropzone instead of four separate
// upload panels. Every photo (weight sheets, B&C counts, requisitions) and
// the Pixel sales report can now be dropped together or one at a time; a
// single batched AI call classifies each new photo (which sheet it is, and
// which shift if that matters) as soon as it lands, tags it with an
// editable pill so a manager can correct a wrong guess, and buckets it into
// the same extraction pipeline "Read Everything" already used. A live
// checklist under the dropzone shows, per section, whether it's missing,
// staged, read, or flagged — so it's obvious at a glance what's left for
// the day before a manager reviews BAR Summary. B&C counts and requisition
// sheets now also support multiple photos per category (was one file).
//
// RULE: bump CACHE every time index.html changes. Keep in lockstep with the
// two version badges in index.html.

const CACHE = 'fd-cc-v2297';

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
