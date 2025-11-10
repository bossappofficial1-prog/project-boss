import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import RootLayout from "@/components/layouts/RootLayout";
import { CustomerSocketListener } from "@/components/socket/CustomerSocketListener";
import { SocketProvider } from "@/context/SocketContext";
import { ThemeProvider } from "next-themes";
import { FeatureGuideProvider } from "@/providers/FeatureGuideProvider";
import { FeatureGuideOverlay } from "@/components/guides/FeatureGuideOverlay";
import { SnackbarProvider } from "@/context/SnackbarContext";
import { SnackbarContainer } from "@/components/shared/Snackbar";
import "./globals.css";

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
  title: "BOSS - Platform Manajemen Bisnis",
  description: "Urus operasional usaha, atur jadwal, dan jaga pelanggan kamu lebih gampang bareng BOSS.",
  icons: "/assets/logo/og-image.png",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BOSS Customer",
    startupImage: [
      "/assets/logo/og-image.png",
    ],
  },
  openGraph: {
    title: "BOSS - Platform Manajemen Bisnis",
    description: "BOSS bantu kamu merapikan operasional bisnis, jadwal layanan, sampai urusan pelanggan dalam satu tempat.",
    url: "https://bossapp.id",
    siteName: "BOSS",
    images: [
      {
        url: "/assets/logo/og-image.png",
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
    images: ["/assets/logo/og-image.png"],
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
        <link rel="apple-touch-icon" href="/assets/logo/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/assets/logo/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#eb2525" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${poppins.variable} font-poppins antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SnackbarProvider>
            <FeatureGuideProvider>
              <SocketProvider>
                <CustomerSocketListener />
                <RootLayout>
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
