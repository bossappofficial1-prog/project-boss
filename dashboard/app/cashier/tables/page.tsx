import { Metadata } from "next";
import { TablesPageClient } from "@/components/cashier/tables/TablesPageClient";

export const metadata: Metadata = {
  title: "Meja & Bill | Sistem Kasir BOSS",
  description: "Kelola meja aktif, generate bill, dan proses pembayaran untuk outlet F&B.",
};

export default function CashierTablesPage() {
  return <TablesPageClient />;
}