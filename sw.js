const CACHE_STATIC = 'ann-dex-static-v2';
const CACHE_DYNAMIC = 'ann-dex-dynamic-v2';
const CACHE_IMAGES = 'ann-dex-images-v2';
const MAX_CACHE_SIZE = 50; // Máx 50 archivos en caché dinámica

// Archivos críticos que NUNCA cambian
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/responsive.css',
    '/scripts/images.js',
    '/scripts/loader.js',
    '/scripts/navigation.js',
    '/scripts/main.js'
];

// INSTALL: Cachear estáticos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_STATIC).then(cache => cache.addAll(STATIC_FILES))
    );
    self.skipWaiting();
});

// ACTIVATE: Limpiar caches viejos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => !key.startsWith('ann-dex-'))
                    .map(key => caches.delete(key))
            )
        )
    );
});

// FETCH: Estrategias inteligentes por tipo
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // ESTRATEGIA 1: Network-First para JSON (datos críticos)
    if (url.pathname.includes('/data/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Solo cachear respuestas OK
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const clone = response.clone();
                    caches.open(CACHE_DYNAMIC).then(cache => {
                        cache.put(request, clone);
                        limitCacheSize(CACHE_DYNAMIC, MAX_CACHE_SIZE);
                    });
                    return response;
                })
                .catch(() => {
                    // Si falla, intentar cache
                    return caches.match(request).then(cached => {
                        if (cached) return cached;
                        // Fallback: devolver JSON vacío
                        return new Response('[]', {
                            headers: {'Content-Type': 'application/json'}
                        });
                    });
                })
        );
        return;
    }

    // ESTRATEGIA 2: Cache-First para imágenes
    if (request.destination === 'image') {
        event.respondWith(
            caches.open(CACHE_IMAGES).then(cache =>
                cache.match(request).then(cached => {
                    // Devolver cache inmediatamente, actualizar en background
                    const fetchPromise = fetch(request).then(networkResponse => {
                        if (networkResponse.ok) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => cached || caches.match(window.placeholder));

                    return cached || fetchPromise;
                })
            )
        );
        return;
    }

    // ESTRATEGIA 3: Stale-While-Revalidate para CSS/JS
    if (request.destination === 'style' || request.destination === 'script') {
        event.respondWith(
            caches.match(request).then(cached => {
                const fetchPromise = fetch(request).then(networkResponse => {
                    if (networkResponse.ok) {
                        caches.open(CACHE_STATIC).then(cache => cache.put(request, networkResponse.clone()));
                    }
                    return networkResponse;
                }).catch(() => cached);

                return cached || fetchPromise;
            })
        );
        return;
    }

    // ESTRATEGIA 4: Cache-First para el resto
    event.respondWith(
        caches.match(request).then(cached => {
            return cached || fetch(request).catch(() => {
                if (request.destination === 'document') {
                    return caches.match('/index.html');
                }
                return new Response('', {status: 404});
            });
        })
    );
});

// LÍMITE DE TAMAÑO DE CACHÉ
async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        await cache.delete(keys[0]); // Borrar el más antiguo
    }
}