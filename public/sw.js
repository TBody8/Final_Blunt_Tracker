// Basic Service Worker to pass PWA installation requirements
const CACHE_NAME = 'blunt-tracker-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// A fetch listener is strictly required by Chrome to pass PWA criteria
self.addEventListener('fetch', (event) => {
  // Explicitly respond with a network fetch so Chrome considers the event handled
  event.respondWith(
    fetch(event.request).catch(error => {
      console.error('Network request failed in SW:', error);
      throw error;
    })
  );
});