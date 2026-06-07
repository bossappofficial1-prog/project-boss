"use client";

import { QueueV2Content } from "@/features/queue";
import { useCashierContext } from "@/components/layouts";

export default function QueuePageClient() {
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

  return <QueueV2Content outletId={outletId} />;
}
