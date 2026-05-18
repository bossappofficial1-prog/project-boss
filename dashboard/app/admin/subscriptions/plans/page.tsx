import SubscriptionPlansContent from "@/components/admin/subcriptions/plans/subscription-plans-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen Paket Langganan",
  description: "Atur harga, durasi, dan batasan fitur untuk setiap paket langganan.",
};

export default function SubscriptionPlansPage() {
  return <SubscriptionPlansContent />;
}
