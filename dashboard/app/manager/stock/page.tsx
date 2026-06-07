"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import StockContent from "@/features/owner/stock/stock-content";

export default function ManagerStockPage() {
  return (
    <PrivilegeGuard requiredPrivilege="STOCK_MANAGEMENT">
      <StockContent />
    </PrivilegeGuard>
  );
}
