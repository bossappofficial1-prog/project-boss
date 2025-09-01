import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import RootLayout from "@/components/layouts/RootLayout";
import { SocketProvider } from "@/context/SocketContext";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOSS",
  description: "Manage your business with BOSS",
  icons: "/assets/logo/logo-bossapp.svg"
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
