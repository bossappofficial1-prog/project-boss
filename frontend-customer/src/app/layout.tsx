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
