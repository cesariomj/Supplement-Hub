// service-worker.js - v7 (Aggressive update)

const CACHE_NAME = 'supplement-hub-v7';

console.log('🔧 Service Worker v7 loading...');

self.addEventListener('install', event => {
    console.log('🔧 Service Worker v7 installing...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('🔧 Service Worker v7 activated - clearing old caches');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Deleting old cache:', cache);
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