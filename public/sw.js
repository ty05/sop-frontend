// DISABLED SERVICE WORKER - Unregister immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  // Delete all caches
  caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );
  });

  // Unregister this service worker
  self.registration.unregister();

  // Take control and reload all clients
  self.clients.claim();
});
