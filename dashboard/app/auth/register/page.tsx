import { RegisterContent as RegistrationContent } from "@/features/auth";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Daftar Akun BOSS | Mulai Kelola Bisnis Lebih Profesional",
  description: "Buat akun BOSS Anda hari ini dan nikmati kemudahan mengelola operasional, staff, dan laporan bisnis dalam satu dashboard yang elegan.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Daftar Akun BOSS | Mulai Kelola Bisnis Lebih Profesional",
    description: "Semua data outlet, transaksi, dan analitik bisnis kamu tersaji rapi dalam satu dashboard BOSS. Daftar sekarang.",
    url: "/auth/register",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BOSS Registration",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daftar Akun BOSS | Mulai Kelola Bisnis Lebih Profesional",
    description: "Kelola outlet, transaksi, dan insight bisnis cukup lewat satu dashboard BOSS.",
    images: ["/og-image.jpg"],
  },
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center">Memuat...</div>}>
      <RegistrationContent />
    </Suspense>
  )
}