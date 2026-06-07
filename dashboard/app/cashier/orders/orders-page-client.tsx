"use client";

import { OrdersV2Content } from "@/features/orders";
import { useCashierContext } from "@/components/layouts";

export default function OrdersPageClient() {
  const { outletData } = useCashierContext();
  const outletId = outletData?.id;

  if (!outletId) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p className="text-slate-500 dark:text-slate-400">
          Outlet tidak ditemukan
        </p>
      </div>
    );
  }

  return <OrdersV2Content outletId={outletId} />;
}
