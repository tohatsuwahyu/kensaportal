// tsh-kensa-v1 — naikkan versi ini (v1 -> v2 -> ...) setiap kali file HTML/CSS utama diubah,
// supaya tablet lama tidak nyangkut memakai cache versi lama.
const CACHE_NAME = 'tsh-kensa-v1';
const SHELL_FILES = [
  './index.html', './dashboard.html', './riwayat.html', './schedule.html',
  './audit-log.html', './dx-report.html', './signage.html', './tsh.png', './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL_FILES)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Strategy: network-first untuk backend GAS (data harus selalu fresh),
// cache-first untuk file statis (HTML/CSS/gambar) supaya cepat & bisa offline.
self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return; // POST ke GAS tidak boleh di-cache
  if (url.indexOf('script.google.com') !== -1) return; // data backend selalu network

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((res) => {
        if (res && res.ok) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, resClone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
