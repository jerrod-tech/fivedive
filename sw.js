// Five & Dive Command Center — Service Worker
// v22.111 — Staff Audits restyled onto the v22.110 design system: glass panels and
// hairline borders, sans-only type with tabular numerals (no monospace / tracked caps),
// pill tabs matching the sidebar, frosted runner bars, updated palette, higher-contrast
// flag banner and rating buttons, two-button rows stack on phones, directory chip shows
// recency and score in separate colours. CSS + label casing only — no logic changes.
//
// v22.110 — Visual refresh: deep-slate design tokens, sans display type (no serif/mono
// chrome), glass panels, pill nav with glowing active indicator, softer fields and
// modals, theme-color updated. CSS-only — no logic changes.
//
// v22.109 — Staff Audits: manager-on-phone audits (all 7 paper forms), per-manager
// audit schedule + "suggest this week", employee audit files with notes, audit
// status in the dashboard / Yesterday's Recap / morning summaries. New Worker
// endpoint /sync/staff_audits (deploy fd-cc-sync-worker-full-v9.js).
//
// v22.107 — Coaching Notes: added Write-Up and Audit note types alongside
// Positive/Observation/Corrective, optional photo attachment (compressed
// client-side), an opt-in "notify the team" flag that posts a notification
// naming the employee/type/reason, and cross-device sync (coaching notes
// previously lived only in localStorage on the device that created them —
// now they ride the existing /sync/medias channel like Feature Menus and
// Team Space, so every manager's device sees every note).
//
// v22.106 — Added Carrington Ryan to the management team with the same
// Weights Hub + BOH access as Jason McLean and MacKenzie Irving-Sparling.
//
// v22.105 — Contacts refresh (Vendors & Reps merged with full contacts
// import: 1st RND/Taco Shop, WEM mall, beverage/fire-safety/delivery/comedy/
// catering reps) + new "Bands & Hosts" page — a roster of every band, solo
// artist, and weekly/monthly host with contact info, rate, and a running
// list of past & upcoming show dates (seeded from Gmail + the "Performers"
// Google Calendar). Dashboard/Owner "Performers This Week" and "no performer
// booked" flags now also read from the new roster, not just the old promo
// image gallery.
//
// v22.100 — Layout fix: the v22.99 sidebar change crammed 3 buttons (Weights
// Hub, Daily Fill Tool, Inventory Hub) into one flex row sized for 2,
// cutting off button text. Daily Fill Tool now gets its own full-width row
// below Weights Hub/Inventory Hub instead of squeezing in.
//
// v22.99 — Added a "Daily Fill Tool ↗" shortcut, both in the sidebar/app
// switcher and as a banner on the in-app Weights Hub page, linking out to
// the new standalone Daily Weights Auto-Fill tool (hosted separately on
// GitHub Pages at jerrod-tech.github.io/fivedive-daily-fill/ — that repo
// is set up by Jerrod, this app just links to it). This is a companion
// link, not a replacement: the in-app Weights Hub page still owns history,
// BAR Summary, variance, and compliance audits, which the standalone tool
// doesn't do. The standalone tool only handles the nightly photo+PDF ->
// Excel fill step.
//
// v22.98 — Bug fix: the Weights Hub's AI photo-reading (Daily Intake
// auto-classify + extraction) was checking localStorage key
// 'fd_anthropic_key' / STATE.anthropicApiKey for the Anthropic API key, but
// nothing in the app ever wrote to that key — the actual Settings/Control
// Center "AI / Anthropic Key" field saves to 'fd_inbox_api_key' /
// STATE.inboxApiKey instead. So even after saving a key in Settings, the
// Weights Hub silently treated it as missing. Fixed by having the Weights
// Hub's AI calls check the real Settings key first (falling back to the old
// names in case anything else ever sets them). No UI change needed — the
// existing Control Center → AI / Anthropic Key section IS the save-a-key
// section; it just wasn't wired to this feature.
//
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

const CACHE = 'fd-cc-v22114';

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
