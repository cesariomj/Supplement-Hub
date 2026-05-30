// service-worker.js - v11 (Nuclear Cache Clear)

const CACHE_NAME = 'supplement-hub-v11';

console.log('🔧 Service Worker v11 loading...');

self.addEventListener('install', event => {
    console.log('🔧 Service Worker v11 installing...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('🔧 Service Worker v11 activated - clearing ALL old caches');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    console.log('🗑️ Deleting cache:', cache);
                    return caches.delete(cache);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(() => caches.match('/'))
    );
});