"use client";

import { useCashierContext } from "@/app/cashier/layout";
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
