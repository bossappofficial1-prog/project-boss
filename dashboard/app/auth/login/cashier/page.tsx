import { CashierLoginForm } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login Kasir & Manager | BOSS POS",
  description:
    "Halaman login untuk Kasir dan Manager BOSS POS. Akses sistem Point of Sales untuk memulai shift, mengelola pesanan, dan menjalankan operasional outlet.",

  // Open Graph
  openGraph: {
    title: "Login Kasir & Manager | BOSS POS",
    description:
      "Akses sistem Point of Sales BOSS POS. Login untuk memulai shift, mengelola pesanan, dan menjalankan operasional outlet Anda.",
    url: "https://cashier.bossapp.id/auth/login/cashier",
    siteName: "BOSS POS",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "https://cashier.bossapp.id/images/banner-op-dashboard.png",
        width: 1200,
        height: 630,
        alt: "BOSS POS - Login Kasir & Manager",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Login Kasir & Manager | BOSS POS",
    description:
      "Akses sistem Point of Sales BOSS POS. Login untuk memulai shift dan menjalankan operasional outlet.",
    images: ["https://cashier.bossapp.id/images/banner-op-dashboard.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  // Canonical URL
  alternates: {
    canonical: "https://cashier.bossapp.id/auth/login/cashier",
  },

  // Meta tambahan
  keywords: [
    "login kasir",
    "login manager",
    "BOSS POS",
    "point of sales",
    "sistem kasir",
    "aplikasi POS",
    "manajemen outlet",
  ],

  applicationName: "BOSS Kasir",
  authors: [{ name: "BOSS POS Team" }],
  creator: "BOSS",
  publisher: "BOSS",
};
export default function CashierLoginPage() {
  return <CashierLoginForm />;
}
