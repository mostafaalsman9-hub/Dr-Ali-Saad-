// Service Worker لتخزين الملفات الثابتة (HTML, CSS, JS, الأيقونات)
// لتشغيل الموقع بشكل أسرع وأوفلاين عند الإمكان
// لا يخزن طلبات Firebase - تظل تذهب مباشرة للسيرفر

const CACHE_NAME = "dr-ali-static-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon.svg",
  "./icon-maskable.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // لا تتدخل في طلبات Firebase أو Google fonts API أو غيرها من الـ APIs
  if (req.method !== "GET") return;
  if (url.hostname.includes("firebaseio.com")) return;
  if (url.hostname.includes("firebasedatabase.app")) return;
  if (url.hostname.includes("googleapis.com")) return;
  if (url.hostname.includes("gstatic.com")) return;
  if (url.pathname.startsWith("/api/")) return;

  // للأصول الثابتة على نفس النطاق: cache-first مع تحديث في الخلفية
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        const networkFetch = fetch(req).then(response => {
          if (response && response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return response;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
