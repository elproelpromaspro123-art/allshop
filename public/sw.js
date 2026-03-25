const CACHE_VERSION = "vortixy-editorial-v20260325";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const OFFLINE_HTML = `<!doctype html>
<html lang="es-CO">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vortixy · Sin conexión</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Segoe UI", Arial, sans-serif;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top right, rgba(16, 185, 129, 0.14), transparent 30%),
          linear-gradient(180deg, #f7f2ea 0%, #f0e8dd 100%);
        color: #17130f;
      }
      main {
        width: min(32rem, calc(100% - 2rem));
        border-radius: 28px;
        border: 1px solid rgba(23, 19, 15, 0.08);
        background: rgba(255, 252, 248, 0.92);
        box-shadow: 0 24px 80px rgba(23, 19, 15, 0.08);
        padding: 2rem;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        border-radius: 999px;
        background: rgba(13, 138, 99, 0.08);
        color: #0d8a63;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.18em;
        padding: 0.65rem 0.9rem;
        text-transform: uppercase;
      }
      h1 {
        margin: 1rem 0 0.6rem;
        font-size: clamp(2rem, 6vw, 2.7rem);
        line-height: 0.96;
        letter-spacing: -0.05em;
      }
      p {
        margin: 0;
        color: #645d53;
        line-height: 1.7;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      a, button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        cursor: pointer;
        font: inherit;
        padding: 0.9rem 1.2rem;
        text-decoration: none;
      }
      a {
        background: linear-gradient(135deg, #0d8a63, #14b884);
        color: white;
        font-weight: 700;
      }
      button {
        background: rgba(23, 19, 15, 0.06);
        color: #17130f;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="eyebrow">Vortixy offline</div>
      <h1>Tu conexión cayó, tu compra no.</h1>
      <p>Si ya visitaste esta página o producto, intentaremos mostrarlo desde caché. Cuando vuelva la red, podrás continuar el flujo normalmente.</p>
      <div class="actions">
        <button onclick="location.reload()">Reintentar</button>
        <a href="/">Volver al inicio</a>
      </div>
    </main>
  </body>
</html>`;

const PRECACHE_URLS = [
  "/",
  "/faq",
  "/envios",
  "/devoluciones",
  "/soporte",
  "/seguimiento",
  "/checkout",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return (
      cached ||
      new Response(OFFLINE_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 503,
      })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|jpg|jpeg|svg|webp|avif|woff2?|mp4|webm)$/i.test(url.pathname);
  const isApi = url.pathname.startsWith("/api/");
  const isNavigation = request.mode === "navigate";

  if (isApi) {
    return;
  }

  if (isAsset) {
    event.respondWith(cacheFirst(request, ASSET_CACHE).catch(() => caches.match(request)));
    return;
  }

  if (isNavigation && isSameOrigin) {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});
