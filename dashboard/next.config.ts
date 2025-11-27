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
};

export default nextConfig;
