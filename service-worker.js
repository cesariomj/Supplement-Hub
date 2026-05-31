// service-worker.js - v14

const CACHE_NAME = 'supplement-hub-v14';

console.log('🔧 Service Worker v14 loading...');

self.addEventListener('install', event => {
    console.log('🔧 Service Worker v14 installing...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('🔧 Service Worker v14 activated - clearing ALL old caches');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    console.log('🗑️ Deleting old cache:', cache);
                    return caches.delete(cache);
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