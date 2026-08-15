// Five & Dive Command Center — Service Worker
// v22.95 — Weights Hub reorganized to mirror the real Excel workbook: the old
// shift-based flow (Morning/Req/Changeover/Closing/Pixel/Summary) is now
// presented as 5 tabs matching the Excel's own sheet names — Weight Sheet,
// Pixel Rung In, Bottles & Cans, Draught, BAR Summary — so the team can
// navigate it the same way they already navigate the spreadsheet. The
// underlying shift-based render functions (proven correct from v22.94) were
// left untouched; only where their target tables live in the DOM moved. The
// Pixel drag-and-drop import and photo-AI-extraction features are unchanged.
// Also fixed a real gap found while testing this reorg: reopening a day's
// Pixel Rung In tab after the file was already dropped and applied (e.g. on
// a later visit, or after the data arrived via sync from another device)
// left the whole parsed-report panel hidden — whRenderPixelPreview() now
// restores it whenever the tab opens, not just at the moment of parsing.
//
// RULE: bump CACHE every time index.html changes. Keep in lockstep with the
// two version badges in index.html.

const CACHE = 'fd-cc-v2295';

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
