import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

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
  output: 'standalone',
  reactStrictMode: false,
  images: {
    remotePatterns: parseRemotePatterns(process.env.NEXT_PUBLIC_REMOTE_PATTERNS || '')
  },
  generateBuildId: async () => {
    return 'boss-customer-' + (process.env.NEXT_PUBLIC_BUILD_ID || Date.now());
  },
};

export default withSerwist(nextConfig);
