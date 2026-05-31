// service-worker.js - v15 (Final Clean)
const CACHE_NAME = 'supplement-hub-v15';

console.log('🔧 Service Worker v15 loading...');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
    console.log('🔧 v15 activated - clearing everything');
    event.waitUntil(
        caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))))
    ).then(() => self.clients.claim());
});

self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});