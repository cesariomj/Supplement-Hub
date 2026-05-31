// service-worker.js - v17 (Fixed Activation)

const CACHE_NAME = 'supplement-hub-v17';

console.log('🔧 Service Worker v17 loading...');

self.addEventListener('install', event => {
    console.log('🔧 Service Worker v17 installing...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('🔧 Service Worker v17 activated - clearing old caches');
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
        fetch(event.request).catch(() => caches.match(event.request) || caches.match('/'))
    );
});