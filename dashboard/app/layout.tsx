import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { NavigationProvider } from "@/components/providers/NavigationProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// SEO Metadata
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010",
  ),
  title: {
    default: "BOSS Dashboard",
    template: "%s",
  },
  description:
    "Pantau outlet, transaksi, dan insight bisnis secara real-time lewat dashboard BOSS yang praktis.",
  keywords: [
    "dashboard bisnis",
    "manajemen operasional",
    "monitor outlet",
    "pantau transaksi",
    "analytics bisnis",
    "sistem kasir",
    "manajemen stok",
  ],
  authors: [{ name: "BOSS Team" }],
  creator: "BOSS Development Team",
  publisher: "BOSS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "BOSS - Dukungan Operasional Bisnismu",
    description:
      "Semua data outlet, transaksi, dan analitik bisnis kamu tersaji rapi dalam satu dashboard BOSS.",
    siteName: "BOSS Dashboard",
    images: [
      {
        url: "/images/banner-op-dashboard.png",
        width: 1200,
        height: 630,
        alt: "BOSS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BOSS Dashboard - Dukungan Operasional Bisnismu",
    description:
      "Kelola outlet, transaksi, dan insight bisnis cukup lewat satu dashboard BOSS.",
    images: ["/images/banner-op-dashboard.png"],
    creator: "@boss_dashboard",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "msapplication-TileColor": "#2563eb",
    "msapplication-config": "/browserconfig.xml",
  },
  alternates: {
    canonical: "/",
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

// Structured Data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "BOSS Dashboard",
  description: "Dashboard dukungan operasional bisnis",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
  creator: {
    "@type": "Organization",
    name: "BOSS Development Team",
  },
  publisher: {
    "@type": "Organization",
    name: "BOSS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link
          rel="canonical"
          href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010"}
        />
        <meta name="theme-color" content="#eb2525" />
        <meta name="color-scheme" content="light dark" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && (event.reason.name === 'ChunkLoadError' || event.reason.message?.includes('ChunkLoadError'))) {
                  const key = 'last-chunk-load-error-reload';
                  const lastReload = sessionStorage.getItem(key);
                  const now = Date.now();
                  if (!lastReload || now - parseInt(lastReload) > 10000) {
                    sessionStorage.setItem(key, now.toString());
                    window.location.reload();
                  }
                }
              });
              window.addEventListener('error', function(event) {
                if (event.message && event.message.includes('ChunkLoadError')) {
                  const key = 'last-chunk-load-error-reload';
                  const lastReload = sessionStorage.getItem(key);
                  const now = Date.now();
                  if (!lastReload || now - parseInt(lastReload) > 10000) {
                    sessionStorage.setItem(key, now.toString());
                    window.location.reload();
                  }
                }
              }, true);
            `,
          }}
        />
      </head>
      <body
        className={`${poppins.variable} font-poppins antialiased min-h-screen text-foreground`}
      >
        <ThemeProvider defaultTheme="system">
          <LoadingProvider>
            <Suspense fallback={null}>
              <NavigationProvider>
                <QueryProvider>{children}</QueryProvider>
              </NavigationProvider>
            </Suspense>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
