"use client";

import { OrdersV2Content } from "@/components/cashier/orders-v2/OrdersV2Content";
import { useCashierContext } from "../layout";

export default function CashierOrdersV2Page() {
  const { outletData } = useCashierContext();
  const outletId = outletData?.id;

  if (!outletId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 dark:text-slate-400">Outlet tidak ditemukan</p>
      </div>
    );
  }

  return <OrdersV2Content outletId={outletId} />;
}
