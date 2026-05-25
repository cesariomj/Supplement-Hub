// service-worker.js - v4 (Improved for PWA)

const CACHE_NAME = 'supplement-hub-v4';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

console.log('🔧 Service Worker v4 loading...');

// Install - Cache essential files
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing v4...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Activate - Clean old caches
self.addEventListener('activate', event => {
    console.log('🔧 Service Worker activated v4');
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

// Fetch - Network first, then cache
self.addEventListener('fetch', event => {
    // Skip Firebase and POST requests
    if (event.request.url.includes('firebase') || event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline fallback
                return caches.match(event.request)
                    .then(cachedResponse => {
                        return cachedResponse || caches.match('/');
                    });
            })
    );
});