import OwnerReservationsContent from "@/components/owner/reservations/owner-reservations-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservasi Meja | Project Boss",
  description: "Manajemen reservasi meja outlet",
};

export default function ReservationsPage() {
  return <OwnerReservationsContent />;
}
