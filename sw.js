// Bump on every release: the activate handler deletes every other cache, which
// is what actually evicts stale assets.
const CACHE_NAME = "string-transformer-v4";

// The shell needed to render something usable offline. The JS modules under
// src/js/ are deliberately not listed: index.js imports them all statically, so
// the first online visit pulls them in and the fetch handler below caches each
// one — no list to keep in sync every time a transformer is added.
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./index.js",
  "./manifest.json",
  "./favicon.svg",
  "./style.css",
  "./src/css/app.css",
  "./src/css/tokens.css",
  "./src/css/base.css",
  "./src/css/site.css",
  "./src/css/command-menu.css",
  "./src/css/seo.css",
  "./src/css/dialog.css",
  // LUZ design system: tokens, the FAQ component and the ET Book face.
  "./src/css/vendor/luz/luz-tokens.css",
  "./src/css/vendor/luz/faq.css",
  "./src/css/vendor/luz/fonts/serif/ETBook-Roman.woff2",
  "./src/css/vendor/luz/fonts/serif/ETBook-Italic.woff2",
  "./src/css/vendor/luz/fonts/serif/ETBook-SemiBold.woff2",
  "./src/css/vendor/luz/fonts/serif/ETBook-Bold.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// Stale-while-revalidate: serve from cache immediately when available, and
// refresh the cache in the background so the next offline visit is current.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
