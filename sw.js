// ============================================================
// Five & Dive Command Center — Service Worker (v19.4.1)
// ============================================================
// NETWORK-FIRST auto-update strategy:
//  - Every load tries the network first, so the newest version you push to
//    GitHub is always fetched and shown — no uninstall/reinstall needed.
//  - The cache is only used as a fallback when the device is offline.
//  - Supabase and CDN requests are never intercepted (they go straight to network).
//
// Upload this file as `sw.js` in the SAME folder as index.html on GitHub.

const CACHE = 'fd-cc-v1941';

self.addEventListener('install', (e) => {
  // Activate this new SW immediately instead of waiting for old tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Clean up any old caches from previous versions
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Never intercept external services — let the app talk to them directly.
  if (
    url.hostname.indexOf('supabase') !== -1 ||
    url.hostname.indexOf('jsdelivr') !== -1 ||
    url.hostname.indexOf('cdn') !== -1 ||
    url.hostname.indexOf('googleapis') !== -1
  ) {
    return;
  }

  // Network-first: fetch fresh, cache a copy, fall back to cache when offline.
  e.respondWith(
    fetch(req)
      .then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        } catch (_) {}
        return res;
      })
      .catch(() =>
        caches.match(req).then((m) => m || caches.match('./') || caches.match('index.html'))
      )
  );
});
