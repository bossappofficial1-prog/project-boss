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
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: {
    default: 'BOSS Customer',
    template: '%s | BOSS'
  },
  description: "Urus operasional usaha, atur jadwal, dan jaga pelanggan kamu lebih gampang bareng BOSS.",
  icons: {
    icon: [
      { url: "/assets/logo/favicon.ico", type: "image/x-icon" },
      { url: "/assets/logo/web-icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/assets/logo/web-icon-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/assets/logo/web-icon-192x192.png",
    shortcut: "/assets/logo/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BOSS Customer",
    startupImage: [
      `${process.env.SITE_URL}/assets/logo/og-image.png`,
    ],
  },
  openGraph: {
    title: "BOSS - Platform Manajemen Bisnis",
    description: "BOSS bantu kamu merapikan operasional bisnis, jadwal layanan, sampai urusan pelanggan dalam satu tempat.",
    url: "https://bossapp.id",
    siteName: "BOSS",
    images: [
      {
        url: `${process.env.SITE_URL}/assets/logo/og-image.png`,
        width: 1200,
        height: 630,
        alt: "BOSS Business Management Platform",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BOSS - Platform Manajemen Bisnis",
    description: "Optimalkan operasional, jadwal, dan pengalaman pelanggan bisnis kamu cukup lewat BOSS.",
    images: [`${process.env.SITE_URL}/assets/logo/og-image.png`],
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
  keywords: ["business management", "scheduling", "customer management", "BOSS", "business platform"],
  authors: [{ name: "BOSS Team" }],
  creator: "BOSS Team",
  publisher: "BOSS",
  category: "business",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "BOSS Customer",
  "description": "BOSS customer",
  "url": process.env.SITE_URL || 'http://localhost:3000',
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "IDR"
  },
  "creator": {
    "@type": "Organization",
    "name": "BOSS Development Team"
  },
  "publisher": {
    "@type": "Organization",
    "name": "BOSS"
  }
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning={true}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BOSS Customer" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/logo/icon-192x192.png" />
        <link rel="icon" type="image/x-icon" href="/assets/logo/favicon.ico" />
        <link rel="shortcut icon" href="/assets/logo/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#eb2525" />
        <meta name="color-scheme" content="light dark" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
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
        className={`${poppins.variable} font-poppins antialiased`}
      >
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
