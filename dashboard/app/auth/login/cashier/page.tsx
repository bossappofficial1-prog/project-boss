import { Metadata } from "next";
import CashierLoginForm from "@/components/cashier/auth/CashierLoginForm";

export const metadata: Metadata = {
  title: "Login Kasir & Manager",
  description:
    "Halaman login untuk Kasir dan Manager BOSS POS. Akses sistem Point of Sales untuk memulai shift, mengelola pesanan, dan menjalankan operasional outlet.",
};

export default function CashierLoginPage() {
  return <CashierLoginForm />;
}
