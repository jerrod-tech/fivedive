// Five & Dive Command Center — Service Worker
// v20.9 — Manager-only logbook reminders + iOS Safari dictation duplication fix
//
// Strategy: NETWORK-FIRST for same-origin app files (always fetch the newest
// index.html from GitHub Pages; fall back to cache only when offline). This
// avoids the uninstall/reinstall cycle while you're actively iterating.
//
// IMPORTANT: bump CACHE every time index.html changes so clients are guaranteed
// fresh code on next load. (This is the value that was missed last time —
// keep it in lockstep with the two version badges in index.html.)

const CACHE = 'fd-cc-v209a';

// Same-origin core files to pre-cache for offline use.
const CORE = [
  './',
  './index.html'
];

// Hosts we must NEVER intercept — these must always hit the live network.
// (Backend + CDNs: Supabase, jsDelivr, generic CDNs, Google APIs.)
const BYPASS_HOSTS = [
  'supabase.co',
  'supabase.in',
  'jsdelivr.net',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'googleapis.com',
  'gstatic.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).catch(() => {})
  );
  // Activate this version immediately, don't wait for old tabs to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET.
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // Never intercept backend / CDN hosts — let them hit the network live.
  if (BYPASS_HOSTS.some((h) => url.hostname.endsWith(h))) return;

  // Only manage same-origin requests; let cross-origin pass through.
  if (url.origin !== self.location.origin) return;

  // NETWORK-FIRST: try the network, fall back to cache when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Cache a fresh copy of successful same-origin responses.
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match('./index.html'))
      )
  );
});
