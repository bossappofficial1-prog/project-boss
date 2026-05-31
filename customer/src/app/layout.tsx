import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import RootLayout from "@/components/layouts/RootLayout";
import SerwistRegister from "@/components/SerwistRegister";
import { CustomerSocketListener } from "@/components/socket/CustomerSocketListener";
import { SocketProvider } from "@/context/SocketContext";
import { ThemeProvider } from "next-themes";
import { FeatureGuideProvider } from "@/providers/FeatureGuideProvider";
import { FeatureGuideOverlay } from "@/components/guides/FeatureGuideOverlay";
import { SnackbarProvider } from "@/context/SnackbarContext";
import { SnackbarContainer } from "@/components/shared/Snackbar";
import "./globals.css";
import SplashScreen from "@/components/shared/SplashScreen";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#eb2525",
};

export const metadata: Metadata = {
  title: {
    default: "BOSS - Pesan & Pantau Ordermu",
    template: "%s | BOSS",
  },
  description:
    "Temukan outlet terdekat, pesan langsung, pantau status order, dan bayar — semua lewat aplikasi pelanggan BOSS.",
  icons: {
    icon: [
      { url: "/assets/logo/favicon.ico", type: "image/x-icon" },
      {
        url: "/assets/logo/web-icon-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/assets/logo/web-icon-512x512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: "/assets/logo/web-icon-192x192.png",
    shortcut: "/assets/logo/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BOSS",
    startupImage: [`https://customer.bossapp.id/assets/logo/og-image.png`],
  },
  openGraph: {
    title: "BOSS - Pesan & Pantau Ordermu",
    description:
      "Temukan outlet terdekat, pesan langsung, pantau status order, dan bayar — semua lewat aplikasi pelanggan BOSS.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://customer.bossapp.id",
    siteName: "BOSS",
    images: [
      {
        url: `https://customer.bossapp.id/assets/logo/og-image.png`,
        width: 1200,
        height: 630,
        alt: "BOSS - Aplikasi Pelanggan untuk Pesan dan Pantau Order",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BOSS - Pesan & Pantau Ordermu",
    description:
      "Temukan outlet terdekat, pesan langsung, pantau status order, dan bayar — semua lewat aplikasi pelanggan BOSS.",
    images: [`https://customer.bossapp.id/assets/logo/og-image.png`],
  },
  alternates: {
    canonical: "https://customer.bossapp.id",
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "pesan makanan online",
    "aplikasi pelanggan",
    "order tracking",
    "cari outlet terdekat",
    "bayar qris",
    "boss customer app",
    "pesan di tempat",
  ],
  authors: [{ name: "BOSS" }],
  creator: "BOSS",
  publisher: "BOSS",
  category: "business",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "BOSS - Aplikasi Pelanggan",
  description:
    "Temukan outlet terdekat, pesan langsung, pantau status order, dan bayar lewat aplikasi pelanggan BOSS.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://customer.bossapp.id",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser, iOS, Android",
  inLanguage: "id-ID",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
  featureList: [
    "Cari outlet terdekat",
    "Pesan menu langsung dari HP",
    "Pantau status order real-time",
    "Pembayaran QRIS dan digital",
    "Riwayat transaksi pelanggan",
  ],
  creator: {
    "@type": "Organization",
    name: "BOSS",
    url: "https://bossapp.id",
  },
  publisher: {
    "@type": "Organization",
    name: "BOSS",
    url: "https://bossapp.id",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning={true}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BOSS" />
        <meta name="geo.region" content="ID" />
        <meta name="geo.placename" content="Indonesia" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/assets/logo/web-icon-192x192.png"
        />
        <link rel="icon" type="image/x-icon" href="/assets/logo/favicon.ico" />
        <link rel="shortcut icon" href="/assets/logo/favicon.ico" />
        <meta name="color-scheme" content="light dark" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
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
      <body className={`${poppins.variable} font-poppins antialiased`}>
        {/* Splash screen */}
        <SplashScreen />
        <SerwistRegister />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SnackbarProvider>
            <FeatureGuideProvider>
              <SocketProvider>
                <RootLayout>
                  <CustomerSocketListener />
                  {children}
                </RootLayout>
              </SocketProvider>
              <FeatureGuideOverlay />
            </FeatureGuideProvider>
            <SnackbarContainer />
          </SnackbarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
