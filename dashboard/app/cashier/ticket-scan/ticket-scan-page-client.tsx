"use client";

import TicketScanContent from "@/components/cashier/ticket-scan/TicketScanContent";
import { useCashierContext } from "@/components/cashier/layout/CashierLayoutClient";

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
