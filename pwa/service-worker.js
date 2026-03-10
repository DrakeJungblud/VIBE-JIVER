//const CACHE_NAME = 'vj-studio-v1';
const ASSETS = [
'../index.html',
'../modules/beDucky/ducky.js',
'../modules/beDucky/ducky.css',
'../pwa/manifest.webmanifest',
'../ducky.png'
];

self.addEventListener('install', (e) => {
e.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
);
});

self.addEventListener('fetch', (e) => {
e.respondWith(
caches.match(e.request).then(res => res || fetch(e.request))
);
}); service worker placeholder 
