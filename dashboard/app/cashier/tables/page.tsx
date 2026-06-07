import { Metadata } from "next";
import { TablesPageClient } from "@/features/tables";

export const metadata: Metadata = {
  title: "Meja & Bill",
  description: "Kelola meja aktif, generate bill, dan proses pembayaran untuk outlet F&B.",
};

export default function CashierTablesPage() {
  return <TablesPageClient />;
}