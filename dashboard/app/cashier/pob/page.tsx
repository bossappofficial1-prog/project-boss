import { Metadata } from "next";
import PobPageClient from "./pob-page-client";

export const metadata: Metadata = {
  title: "POB",
  description: "Purchase Order Bahan — kelola pembelian stok dan bahan baku untuk outlet.",
};

export default function PobV2Page() {
  return <PobPageClient />;
}
