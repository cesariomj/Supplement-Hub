// service-worker.js - v5 (Better Offline for iPad Safari)

const CACHE_NAME = 'supplement-hub-v5';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

console.log('🔧 Service Worker v5 loading...');

// Install
self.addEventListener('install', event => {
    console.log('🔧 Service Worker v5 installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Activate
self.addEventListener('activate', event => {
    console.log('🔧 Service Worker v5 activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch - Stronger offline fallback
self.addEventListener('fetch', event => {
    // Skip Firebase and non-GET requests
    if (event.request.url.includes('firebase') || event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return response;
            })
            .catch(() => {
                // Offline: Try cache first, fallback to index.html
                return caches.match(event.request)
                    .then(cachedResponse => {
                        return cachedResponse || caches.match('/');
                    });
            })
    );
});