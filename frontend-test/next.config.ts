import { parseRemotePatterns } from "@/lib/utils";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: parseRemotePatterns(process.env.NEXT_PUBLIC_REMOTE_PATTERNS!)
  },
  // allowedDevOrigins: ["http://192.168.100.248:3000"]
};

export default nextConfig;
