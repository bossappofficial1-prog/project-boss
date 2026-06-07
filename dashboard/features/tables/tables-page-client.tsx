"use client";

import { useCashierContext } from "@/components/layouts";
import { TablesContent } from "./tables-content";

export function TablesPageClient() {
  const { outletData } = useCashierContext();

  if (!outletData) {
    return null;
  }

  return <TablesContent outletId={outletData.id} outletName={outletData.name} />;
}