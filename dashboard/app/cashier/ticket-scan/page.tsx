import { Metadata } from "next";
import TicketScanPageClient from "./ticket-scan-page-client";

export const metadata: Metadata = {
  title: "Scan Tiket",
  description: "Scan dan validasi tiket pelanggan — verifikasi tiket masuk secara cepat.",
};

export default function CashierTicketScanPage() {
  return <TicketScanPageClient />;
}
