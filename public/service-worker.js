const CACHE_NAME = "negosyodepot-shell-v4";
const SHELL = [
  "/",
  "/index.html",
  "/styles-fulfillment.css?v=4",
  "/design-system.css?v=16",
  "/app-fulfillment.js?v=6",
  "/extras-fulfillment.js?v=1",
  "/redesign.js?v=14",
  "/pwa.js?v=2",
  "/manifest.webmanifest",
  "/assets/app-icon-192.png",
  "/assets/app-icon-512.png",
  "/assets/negosyodepot-logo.png",
  "/assets/negosyodepot-mark.png"
];
const STATIC_PATHS = new Set([
  "/", "/index.html", "/styles-fulfillment.css", "/design-system.css",
  "/app-fulfillment.js", "/extras-fulfillment.js", "/redesign.js", "/pwa.js",
  "/manifest.webmanifest", "/assets/app-icon-192.png", "/assets/app-icon-512.png",
  "/assets/negosyodepot-logo.png", "/assets/negosyodepot-mark.png"
]);
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("negosyodepot-shell-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match("/index.html"))));
    return;
  }
  if (STATIC_PATHS.has(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    })));
  }
});
