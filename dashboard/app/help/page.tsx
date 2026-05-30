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
