// service-worker.js - Enhanced PWA Caching (v3)

const CACHE_NAME = 'supplement-hub-v3';

const staticAssets = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app.js',
  '/bottles.js',
  '/bottle-modal.js',
  '/safety-limits.js',
  '/vendors.js',
  '/users.js',
  '/overlimits.js',
  '/planner.js',
  '/shopping.js',
  '/utils.js',
  '/firebase.js'
];

console.log('🔧 Service Worker v3 loading...');

// Install
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing v3...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(staticAssets))
            .then(() => self.skipWaiting())
    );
});

// Activate
self.addEventListener('activate', event => {
    console.log('🔧 Service Worker activated v3');
    event.waitUntil(self.clients.claim());
});

// Fetch - Only cache GET requests, skip Firebase POSTs
self.addEventListener('fetch', event => {
    // Skip non-GET requests and Firebase streams
    if (event.request.method !== 'GET' || 
        event.request.url.includes('firestore') || 
        event.request.url.includes('googleapis')) {
        return event.respondWith(fetch(event.request));
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                return cachedResponse || fetch(event.request).then(response => {
                    // Cache successful responses
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            })
            .catch(() => {
                // Offline fallback
                return caches.match('/index.html');
            })
    );
});