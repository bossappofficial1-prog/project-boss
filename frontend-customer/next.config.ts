import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const apiOrigin = (() => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    return new URL(apiUrl).origin;
  } catch {
    return null;
  }
})();

type RemotePattern = {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
};

const parseRemotePatterns = (patterns: string): RemotePattern[] => {
  const defaults: RemotePattern[] = [
    { protocol: "https", hostname: "bossapp.id", pathname: "/**" },
    { protocol: "https", hostname: "api.bossapp.id", pathname: "/**" },
    { protocol: "https", hostname: "dashboard.bossapp.id", pathname: "/**" },
    { protocol: "http", hostname: "localhost", pathname: "/**" },
  ];

  const fromUrl = (urlStr: string): RemotePattern | null => {
    try {
      const url = new URL(urlStr);
      const protocol = url.protocol.replace(":", "") as "http" | "https" | "";
      const pattern: RemotePattern = {
        protocol: protocol === "http" || protocol === "https" ? protocol : undefined,
        hostname: url.hostname,
        pathname: url.pathname === "/" ? "/**" : url.pathname,
      };

      if (url.port) {
        pattern.port = url.port;
      }

      return pattern;
    } catch {
      return null;
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    const pattern = fromUrl(apiUrl);
    if (pattern) {
      defaults.push(pattern);
    }
  }

  if (!patterns || patterns.trim() === "") {
    return dedupePatterns(defaults);
  }

  const parsed = patterns
    .split(",")
    .map((pattern) => {
      const trimmed = pattern.trim();
      if (!trimmed) return null;
      if (trimmed.includes("://")) return fromUrl(trimmed);
      return { protocol: "https" as const, hostname: trimmed, pathname: "/**" } satisfies RemotePattern;
    })
    .filter(Boolean) as RemotePattern[];

  return dedupePatterns([...defaults, ...parsed]);
};

const dedupePatterns = (patterns: RemotePattern[]): RemotePattern[] => {
  const map = new Map<string, RemotePattern>();
  for (const pattern of patterns) {
    const key = `${pattern.protocol || ""}//${pattern.hostname}:${pattern.port || ""}${pattern.pathname || ""}`;
    map.set(key, pattern);
  }
  return Array.from(map.values());
};

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: parseRemotePatterns(process.env.NEXT_PUBLIC_REMOTE_PATTERNS || '')
  },
  // allowedDevOrigins: ["http://192.168.100.248:3000"]
};

export default withPWA({
  disable: process.env.NODE_ENV === "development",
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  register: true,
  cacheStartUrl: false,
  dynamicStartUrl: true,
  workboxOptions: {
    disableDevLogs: true,
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: ({ request, url }) => {
          if (request.method !== 'GET' || request.destination !== '') {
            return false;
          }

          if (url.origin === self.location.origin && url.pathname.startsWith('/api')) {
            return true;
          }

          if (apiOrigin && url.origin === apiOrigin) {
            return true;
          }

          return false;
        },
        handler: 'NetworkFirst',
        options: {
          cacheName: 'boss-api-cache-v1',
          networkTimeoutSeconds: 4,
          expiration: {
            maxEntries: 120,
            maxAgeSeconds: 60 * 60 * 24,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: ({ request, url }) =>
          request.destination === 'image' &&
          (url.origin === self.location.origin || url.origin === apiOrigin),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'boss-image-cache-v1',
          expiration: {
            maxEntries: 300,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/_next/static/'),
        handler: 'CacheFirst',
        options: {
          cacheName: 'boss-next-static-v1',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: ({ request }) =>
          request.destination === 'script' ||
          request.destination === 'style' ||
          request.destination === 'font',
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'boss-static-resources-v1',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
})(nextConfig);
