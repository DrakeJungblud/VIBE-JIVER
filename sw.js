const CACHE_NAME = 'vibe-jiver-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './ducky.png'
];

// Install Event: Preparing the Local Vault
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('VIBE JIVER: Target Assets Cached');
      return cache.addAll(ASSETS);
    })
  );
});

// Activation: Cleaning Old Data
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Fetch Event: Serving from Cache when Offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Optional: Provide a custom offline page here if desired
      });
    })
  );
});
