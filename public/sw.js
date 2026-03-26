const CACHE_VERSION = "vortixy-editorial-v20260325";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  "/",
  "/faq",
  "/envios",
  "/devoluciones",
  "/soporte",
  "/seguimiento",
  "/checkout",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon.svg",
  "/favicon.ico",
];

const MAX_PAGE_CACHE_ENTRIES = 30;
const MAX_ASSET_CACHE_ENTRIES = 50;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;

  const excess = keys.length - maxEntries;
  await Promise.all(keys.slice(0, excess).map((request) => cache.delete(request)));
}

async function putInCache(cacheName, request, response, maxEntries) {
  if (!response || !response.ok) return;

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  if (maxEntries) {
    await trimCache(cacheName, maxEntries);
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await putInCache(cacheName, request, response, maxEntries);
  return response;
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then(async (response) => {
      await putInCache(cacheName, request, response, maxEntries);
      return response;
    })
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  const response = await networkPromise;
  return response || new Response("", { status: 504 });
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    await putInCache(cacheName, request, response, MAX_PAGE_CACHE_ENTRIES);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response(
      "<!doctype html><html lang=\"es-CO\"><body><h1>Sin conexion</h1><p>Vuelve a intentar cuando se restablezca la red.</p></body></html>",
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 503,
      },
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isApi = url.pathname.startsWith("/api/");
  const isNavigation = request.mode === "navigate";
  const isAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:png|jpg|jpeg|svg|webp|avif|woff2?|mp4|webm)$/i.test(url.pathname);

  if (isApi) return;

  if (isNavigation && isSameOrigin) {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  if (isAsset) {
    event.respondWith(cacheFirst(request, ASSET_CACHE, MAX_ASSET_CACHE_ENTRIES));
    return;
  }

  if (isSameOrigin) {
    event.respondWith(
      staleWhileRevalidate(request, STATIC_CACHE, MAX_ASSET_CACHE_ENTRIES),
    );
  }
});

// ============================================================
// Web Push Notifications
// ============================================================

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    return;
  }

  const { title, body, icon, badge, tag, url, actions } = data;

  const options = {
    body: body || "Tienes una nueva notificación de Vortixy",
    icon: icon || "/icon-192.png",
    badge: badge || "/icon-192.png",
    tag: tag || "vortixy-notification",
    data: { url: url || "/" },
    actions: actions || [],
    vibrate: [100, 50, 100],
    requireInteraction: false,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title || "Vortixy", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});

self.addEventListener("notificationclose", (event) => {
  // Track notification dismissal if needed
});
