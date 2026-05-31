// service-worker.js - v12 (Nuclear Mode)

const CACHE_NAME = 'supplement-hub-v12';

console.log('🔧 Service Worker v12 loading...');

self.addEventListener('install', event => {
    console.log('🔧 Service Worker v12 installing...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('🔧 Service Worker v12 activated - DESTROYING all old caches');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    console.log('💥 Deleting cache:', cache);
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