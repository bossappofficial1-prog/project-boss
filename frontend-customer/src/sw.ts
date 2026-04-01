/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, StaleWhileRevalidate, NetworkFirst, ExpirationPlugin, CacheableResponsePlugin } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const apiOrigin = (() => {
    const hostname = self.location.hostname;

    if (hostname === "bossapp.id" || hostname === "www.bossapp.id") {
        return "https://api.bossapp.id";
    }

    if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:1234";
    }

    return null;
})();

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    disableDevLogs: true,
    runtimeCaching: [
        // API cache
        {
            matcher: ({ request, url }) => {
                if (request.method !== "GET" || request.destination !== "") return false;
                if (url.origin === self.location.origin && url.pathname.startsWith("/api")) return true;
                if (apiOrigin && url.origin === apiOrigin) return true;
                return false;
            },
            handler: new NetworkFirst({
                cacheName: "boss-api-cache-v1",
                networkTimeoutSeconds: 4,
                plugins: [
                    new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 }),
                    new CacheableResponsePlugin({ statuses: [0, 200] }),
                ],
            }),
        },
        // Image cache
        {
            matcher: ({ request, url }) =>
                request.destination === "image" &&
                (url.origin === self.location.origin || url.origin === apiOrigin),
            handler: new StaleWhileRevalidate({
                cacheName: "boss-image-cache-v1",
                plugins: [
                    new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 }),
                    new CacheableResponsePlugin({ statuses: [0, 200] }),
                ],
            }),
        },
        // Next.js static assets
        {
            matcher: ({ url }) => url.pathname.startsWith("/_next/static/"),
            handler: new CacheFirst({
                cacheName: "boss-next-static-v1",
                plugins: [
                    new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
                    new CacheableResponsePlugin({ statuses: [0, 200] }),
                ],
            }),
        },
        // Static resources (scripts, styles, fonts)
        {
            matcher: ({ request }) =>
                request.destination === "script" ||
                request.destination === "style" ||
                request.destination === "font",
            handler: new StaleWhileRevalidate({
                cacheName: "boss-static-resources-v1",
                plugins: [
                    new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
                    new CacheableResponsePlugin({ statuses: [0, 200] }),
                ],
            }),
        },
    ],
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();

        event.waitUntil(
            self.registration.showNotification(data.title || 'Notifikasi', {
                body: data.body,
                icon: data.icon ?? '/icons/app-icon-192.png',
                badge: data.badge ?? '/icons/app-icon-192-monochrome.png',
                data: { url: data.url || '/' },
                requireInteraction: true
            })
        )
    } catch (error) {
        console.error('[SW Push] Error parsing push data:', error);
    }
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(self.clients.openWindow(event.notification.data.url));
    }
});
serwist.addEventListeners();
