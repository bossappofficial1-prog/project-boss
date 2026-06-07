import { CashierLayoutClient } from "@/components/layouts";
import { Metadata } from "next";
import { FeatureGuideProvider } from "@/features/guides/components/feature-guide-provider";

const appName = "BOSS - Business One Stop System";

export const metadata: Metadata = {
  manifest: "/cashier/manifest.webmanifest",
  title: {
    template: "%s | Kasir BOSS",
    default: "Kasir BOSS",
  },
  description:
    "Terminal POS online untuk kasir — catat transaksi, kelola antrian, pesanan, meja, reservasi, dan pengeluaran outlet real-time.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://bossapp.id",
  ),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: appName,
    title: "Kasir BOSS — POS Online",
    description:
      "Terminal POS untuk kasir: transaksi, antrian, pesanan, meja, reservasi, pengeluaran.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Kasir BOSS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kasir BOSS — POS Online",
    description:
      "Terminal POS untuk kasir: transaksi, antrian, pesanan, meja, reservasi, pengeluaran.",
    images: ["/og-image.jpg"],
  },
};

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureGuideProvider>
      <CashierLayoutClient>{children}</CashierLayoutClient>
    </FeatureGuideProvider>
  );
}
