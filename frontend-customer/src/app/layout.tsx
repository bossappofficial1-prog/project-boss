import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import RootLayout from "@/components/layouts/RootLayout";
import { SocketProvider } from "@/context/SocketContext";
import { ThemeProvider } from "next-themes";
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
  title: "BOSS",
  description: "Manage your business with BOSS",
  icons: "/assets/logo/logo-bossapp.svg",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BOSS Customer",
    startupImage: [
      "/assets/logo/logo-bossapp.svg",
    ],
  },
  openGraph: {
    title: "BOSS - Business Management Platform",
    description: "Manage your business with BOSS - Complete solution for business operations, scheduling, and customer management",
    url: "https://bossapp.id",
    siteName: "BOSS",
    images: [
      {
        url: "/assets/logo/logo-bossapp.svg",
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
    title: "BOSS - Business Management Platform",
    description: "Manage your business with BOSS - Complete solution for business operations",
    images: ["/assets/logo/logo-bossapp.svg"],
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
        <link rel="apple-touch-icon" href="/assets/logo/logo-bossapp.svg" />
        <link rel="icon" type="image/svg+xml" href="/assets/logo/logo-bossapp.svg" />
        <link rel="manifest" href="/manifest.json" />
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
          <SocketProvider>
            <RootLayout>
              {children}
            </RootLayout>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
