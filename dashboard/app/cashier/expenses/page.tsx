import { Metadata } from "next";
import ExpensesPageClient from "./expenses-page-client";

export const metadata: Metadata = {
  title: "Pengeluaran",
  description: "Catat pengeluaran harian outlet — operasional, stok, dan biaya lain-lain.",
};

export default function CashierExpensesPage() {
  return <ExpensesPageClient />;
}
