import type { NextConfig } from "next";
import { parseRemotePatterns } from "./lib/utils";

const nextConfig: NextConfig = {
  // Pin Turbopack root to this app to avoid multi-lockfile confusion
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: parseRemotePatterns(process.env.NEXT_PUBLIC_REMOTE_PATTERNS || '')
  },
  output: 'standalone',
  reactStrictMode: process.env.NODE_ENV === 'production'
};

export default nextConfig;
