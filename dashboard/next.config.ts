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
  reactStrictMode: process.env.NODE_ENV === 'production',
  generateBuildId: async () => {
    return 'boss-dashboard-' + (process.env.NEXT_PUBLIC_BUILD_ID || Date.now());
  },
  async redirects() {
    return [
      {
        source: '/owner/dashboard',
        destination: '/owner',
        permanent: false,
      },
      {
        source: '/owner/dashboard/business',
        destination: '/owner/analytics',
        permanent: false,
      },
      {
        source: '/owner/dashboard/outlets',
        destination: '/owner/outlets',
        permanent: false,
      },
      {
        source: '/owner/dashboard/outlets/manage',
        destination: '/owner/outlets-manage',
        permanent: false,
      },
      {
        source: '/owner/dashboard/outlets/staff',
        destination: '/owner/outlets-staff',
        permanent: false,
      },
      {
        source: '/owner/dashboard/products',
        destination: '/owner/products',
        permanent: false,
      },
      {
        source: '/owner/dashboard/stock',
        destination: '/owner/stock',
        permanent: false,
      },
      {
        source: '/owner/dashboard/customers',
        destination: '/owner/customers',
        permanent: false,
      },
      {
        source: '/owner/dashboard/loyalty',
        destination: '/owner/loyalty',
        permanent: false,
      },
      {
        source: '/owner/dashboard/orders',
        destination: '/owner/orders',
        permanent: false,
      },
      {
        source: '/owner/dashboard/reports',
        destination: '/owner/reports',
        permanent: false,
      },
      {
        source: '/owner/dashboard/expenses',
        destination: '/owner/expenses',
        permanent: false,
      },
      {
        source: '/owner/dashboard/transactions',
        destination: '/owner/transactions',
        permanent: false,
      },
      {
        source: '/owner/dashboard/services',
        destination: '/owner/services',
        permanent: false,
      },
      {
        source: '/owner/dashboard/payments/manual',
        destination: '/owner/payments/manual',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
