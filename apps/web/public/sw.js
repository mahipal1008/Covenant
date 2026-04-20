/* Covenant service worker — Session 6 §9.
 *
 * Strategy:
 *   - HTML navigations: NetworkFirst with a 3 s timeout, falling
 *     back to a cached offline shell.
 *   - Static assets (`/_next/static/*`, fonts, images): CacheFirst,
 *     versioned by request URL (Next emits hashed filenames).
 *   - Everything else: pass-through.
 *
 * The service worker lives in /public so it is served at the origin
 * scope and can intercept every same-origin navigation.
 */

const VERSION = "v1";
const SHELL_CACHE = `covenant-shell-${VERSION}`;
const ASSET_CACHE = `covenant-assets-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/static/") ||
    /\.(woff2?|ttf|otf|png|jpg|jpeg|webp|avif|svg|ico|css|js)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML navigations.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const network = await Promise.race([
            fetch(req),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000))
          ]);
          return network;
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          const cached = await cache.match(OFFLINE_URL);
          return cached ?? new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })()
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const response = await fetch(req);
        if (response.ok) cache.put(req, response.clone());
        return response;
      })
    );
  }
});
