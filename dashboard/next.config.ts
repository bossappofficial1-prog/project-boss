import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack root to this app to avoid multi-lockfile confusion
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
