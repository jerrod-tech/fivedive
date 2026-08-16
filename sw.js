// Five & Dive Command Center — Service Worker
// v22.96 — New "Daily Intake" tab added as the first tab of the Weights Hub:
// drag-and-drop (or share-sheet-style file picking) for the cooler/counts
// photo, the weight sheet photos, the liquor requisition sheet photos, and
// the Pixel sales report PDF, all staged together, then one combined
// "Read Everything" pass runs every applicable AI extraction/parse step and
// writes results into the existing Weight Sheet / Bottles & Cans / Draught /
// Pixel Rung In tables — with a review panel listing what was read, what
// couldn't be matched, and an explicit "Apply Sales Report to Summary"
// button before anything touches BAR Summary's rung-in numbers. Also
// reworked liquor requisitions from one summed total per bin/shift into a
// per-line log (each pull recorded separately with amount, unit, and
// source) so a manager can trace which specific requisition put a bin off,
// instead of only seeing a shift total. whRepairDay migrates any
// old-shape (single total) requisition data forward automatically; nothing
// existing is lost.
//
// RULE: bump CACHE every time index.html changes. Keep in lockstep with the
// two version badges in index.html.

const CACHE = 'fd-cc-v2296';

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
