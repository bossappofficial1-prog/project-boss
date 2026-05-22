import { Metadata } from "next";
import PosPageClient from "./pos-page-client";

export const metadata: Metadata = {
  title: "POS",
  description: "Terminal Point of Sale — layani transaksi pelanggan dengan cepat, kelola keranjang, dan proses pembayaran.",
};

export default function PosV2Page() {
  return <PosPageClient />;
}
