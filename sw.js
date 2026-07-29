/* Service worker del Kiosko — la app abre AL INSTANTE aunque no haya señal.
   App shell: cache-first (index, manifest, íconos, lector de códigos).
   Supabase: siempre red (nunca se cachean datos ni registros). */
const CACHE = "kiosko-v5";
const SHELL = ["./", "./index.html", "./manifest.webmanifest",
               "./icon-192.png", "./icon-512.png", "./zxingjs.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.hostname.endsWith("supabase.co")) return;          // datos: siempre red
  e.respondWith(
    caches.match(e.request, {ignoreSearch: u.origin === location.origin}).then(hit =>
      hit || fetch(e.request).then(r => {
        if (r.ok && (u.origin === location.origin || u.hostname === "cdn.jsdelivr.net")) {
          const cp = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, cp));
        }
        return r;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
