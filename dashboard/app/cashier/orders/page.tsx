import { Metadata } from "next";
import OrdersPageClient from "./orders-page-client";

export const metadata: Metadata = {
  title: "Pesanan",
  description: "Kelola pesanan pelanggan — lihat status, proses, dan selesaikan pesanan dari POS.",
};

export default function CashierOrdersV2Page() {
  return <OrdersPageClient />;
}
