import { Metadata } from "next";
import QueuePageClient from "./queue-page-client";

export const metadata: Metadata = {
  title: "Antrian",
  description: "Atur dan pantau antrian pelanggan secara real-time — panggil, layani, dan selesaikan antrian.",
};

export default function CashierQueueV2Page() {
  return <QueuePageClient />;
}
