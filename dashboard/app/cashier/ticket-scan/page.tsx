"use client";

import TicketScanContent from "@/components/cashier/ticket-scan/TicketScanContent";
import { useCashierContext } from "../layout";

export default function CashierTicketScanPage() {
    const { outletData } = useCashierContext();
    const outletId = outletData?.id;

    if (!outletId) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-slate-500 dark:text-slate-400">Outlet tidak ditemukan</p>
            </div>
        );
    }

    return <TicketScanContent />;
}
