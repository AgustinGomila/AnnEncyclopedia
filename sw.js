const CACHE_NAME = 'ann-dex-v1';
const ESSENTIAL_FILES = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/responsive.css',
    '/scripts/images.js',
    '/scripts/loader.js',
    '/scripts/navigation.js',
    '/scripts/main.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.all(
                ESSENTIAL_FILES.map(url =>
                    fetch(url).then(response => {
                        if (response.ok) return cache.put(url, response);
                        console.warn(`Archivo no encontrado: ${url}`);
                    }).catch(err => console.warn(`No cacheado ${url}:`, err))
                )
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request).catch(() => {
                if (event.request.destination === 'image') {
                    return caches.match('/images/placeholder.jpg');
                }
            });
        })
    );
});