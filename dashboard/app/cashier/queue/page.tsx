"use client";

import { QueueV2Content } from "@/components/cashier/queue-v2/QueueV2Content";
import { useCashierContext } from "../layout";

export default function CashierQueueV2Page() {
  const { outletData } = useCashierContext();
  const outletId = outletData?.id;

  if (!outletId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 dark:text-slate-400">Outlet tidak ditemukan</p>
      </div>
    );
  }

  return <QueueV2Content outletId={outletId} />;
}
