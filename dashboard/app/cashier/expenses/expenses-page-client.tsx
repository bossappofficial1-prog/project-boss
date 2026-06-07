"use client";

import { useCashierContext } from "@/components/layouts";
import { ExpensesContent } from "@/features/expenses";

export default function ExpensesPageClient() {
  const { outletData, cashierData } = useCashierContext();

  if (!outletData?.id) return null;

  return (
    <ExpensesContent
      outletId={outletData.id}
      cashierName={cashierData?.name ?? "Cashier"}
    />
  );
}
