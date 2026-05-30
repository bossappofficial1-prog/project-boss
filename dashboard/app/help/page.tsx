import { Metadata } from "next";
import HelpContent from "./HelpContent";
import helpData from "@/data/help-guides.json";

export const metadata: Metadata = {
  title: "Pusat Bantuan & Panduan BOSS | Business One Stop System",
  description:
    "Panduan lengkap penggunaan dashboard BOSS POS. Pelajari cara mengelola profil bisnis, outlet, staff, produk, stok, kasir, keuangan, dan loyalitas member.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Pusat Bantuan & Panduan BOSS | Business One Stop System",
    description:
      "Panduan lengkap penggunaan dashboard BOSS POS. Pelajari cara mengelola profil bisnis, outlet, staff, produk, stok, kasir, keuangan, dan loyalitas member.",
    url: "https://dashboard.bossapp.id/help",
    siteName: "BOSS",
    images: [
      {
        url: "/images/banner-op-dashboard.png",
        width: 1200,
        height: 630,
        alt: "Pusat Bantuan & Panduan BOSS | Business One Stop System",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
};

export default function HelpPage() {
  return (
    <HelpContent
      ownerCategories={helpData.ownerCategories}
      cashierCategories={helpData.cashierCategories}
      guides={helpData.guides as any}
    />
  );
}
