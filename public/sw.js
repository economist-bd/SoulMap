const CACHE_NAME = 'soulmap-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

// Service Worker Install & Cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetching files from Cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});