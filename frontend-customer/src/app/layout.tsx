import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "BOSS",
  description: "Manage your business with BOSS",
  icons: "/assets/logo/logo-bossapp.svg",
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
