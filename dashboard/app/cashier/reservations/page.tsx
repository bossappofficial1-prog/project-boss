import { Metadata } from "next";
import ReservationsPageClient from "./reservations-page-client";

export const metadata: Metadata = {
  title: "Reservasi",
  description: "Kelola reservasi meja untuk pelanggan — lihat, buat, dan atur jadwal reservasi.",
};

export default function ReservationPage() {
  return <ReservationsPageClient />;
}
