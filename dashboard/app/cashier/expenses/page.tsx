"use client";

import { useCashierContext } from "@/components/cashier/layout/CashierLayoutClient";
import { ExpensesContent } from "@/components/cashier/expenses/ExpensesContent";

export default function CashierExpensesPage() {
  const { outletData, cashierData } = useCashierContext();

  if (!outletData?.id) return null;

  return (
    <ExpensesContent
      outletId={outletData.id}
      cashierName={cashierData?.name ?? "Cashier"}
    />
  );
}
