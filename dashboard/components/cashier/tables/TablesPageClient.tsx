"use client";

import { useCashierContext } from "@/components/cashier/layout/CashierLayoutClient";
import { TablesContent } from "./TablesContent";

export function TablesPageClient() {
  const { outletData } = useCashierContext();

  if (!outletData) {
    return null;
  }

  return <TablesContent outletId={outletData.id} outletName={outletData.name} />;
}