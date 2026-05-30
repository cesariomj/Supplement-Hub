// service-worker.js - v9 (Development + Strong Unregister)

const CACHE_NAME = 'supplement-hub-v9';

console.log('🔧 Service Worker v9 loading...');

self.addEventListener('install', event => {
    console.log('🔧 Service Worker v9 installing...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('🔧 Service Worker v9 activated - clearing ALL old caches');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
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