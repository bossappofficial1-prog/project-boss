import CashierLayoutClient from "@/components/cashier/layout/CashierLayoutClient";
import { Metadata } from "next";
import { FeatureGuideProvider } from "@/components/guides/FeatureGuideProvider";

export const metadata: Metadata = {
  title: "Sistem Kasir | BOSS",
  description: "Terminal penjualan (POS) yang efisien dan terintegrasi untuk operasional bisnis Anda.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Sistem Kasir BOSS",
    description: "Kelola transaksi outlet Anda dengan cepat dan akurat menggunakan Sistem Kasir BOSS.",
    images: ["/og-image.jpg"],
  },
};

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGuideProvider>
      <CashierLayoutClient>{children}</CashierLayoutClient>
    </FeatureGuideProvider>
  );
}
