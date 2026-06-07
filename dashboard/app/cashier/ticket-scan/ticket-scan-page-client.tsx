"use client";

import { TicketScanContent } from "@/features/ticket-scan";
import { useCashierContext } from "@/components/layouts";

export default function TicketScanPageClient() {
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

  return <TicketScanContent />;
}
