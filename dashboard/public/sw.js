const CACHE_NAME = 'boss-dashboard-cache-v2';

// Static assets that are safe to precache.
// We avoid Next.js webpack chunks here to prevent 404 errors during code updates or dev mode.
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/sounds/order-incoming.wav',
  '/sounds/new-order-notification.mp3'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Promise.allSettled guarantees that a single 404 asset will NEVER crash the SW installation!
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url => 
          cache.add(url).catch(err => console.warn(`Gagal precache asset: ${url}`, err))
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Caching strategy: Stale-While-Revalidate for static assets, bypass dev WS & APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Skip hot-reloading WebSockets and API requests
  if (
    url.pathname.startsWith('/_next/webpack-hmr') || 
    url.pathname.startsWith('/api/') || 
    url.pathname.includes('webpack')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch from network in background to refresh the cache dynamically
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* ignore background fetch failures */});

        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Dynamically cache CSS, JS, images, audio
        const isStaticAsset = 
          url.pathname.startsWith('/_next/static/') ||
          url.pathname.endsWith('.png') ||
          url.pathname.endsWith('.jpg') ||
          url.pathname.endsWith('.jpeg') ||
          url.pathname.endsWith('.svg') ||
          url.pathname.endsWith('.wav') ||
          url.pathname.endsWith('.mp3');

        if (isStaticAsset) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch((err) => {
        // Fallback to offline index page on navigation failure
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        throw err;
      });
    })
  );
});

// Web Push Notification Listeners
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notifikasi', {
        body: data.body,
        icon: data.icon ?? '/icon-192x192.png',
        badge: data.badge ?? '/icon-192x192.png',
        data: { url: data.url || '/' },
        requireInteraction: true
      })
    );
  } catch (error) {
    console.error('[SW Push] Gagal mem-parse data push:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(self.clients.openWindow(event.notification.data.url));
  }
});
