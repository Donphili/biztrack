// Minimal service worker: makes BizTrack installable and shows a friendly page when offline.
// It does not cache the app, so a new version is always picked up straight away.
const OFFLINE_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BizTrack is offline</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d0f1c;color:#f1f2fb;font-family:system-ui,sans-serif;text-align:center;padding:24px}h1{font-size:22px;margin:0 0 10px}p{color:#9ba1c8;line-height:1.6;margin:0 0 18px}button{background:#7c5cff;color:#fff;border:0;border-radius:12px;padding:12px 22px;font:inherit;font-weight:700;cursor:pointer}</style></head><body><div><h1>You are offline</h1><p>BizTrack needs an internet connection to load your records.<br>Check your connection and try again.</p><button onclick="location.reload()">Try again</button></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_PAGE, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } })
    )
  );
});
