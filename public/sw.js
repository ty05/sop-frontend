// COMPLETELY DISABLED - This service worker does nothing
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// DO NOT intercept any fetch requests
self.addEventListener('fetch', (event) => {
  // Do nothing - let all requests pass through
  return;
});
