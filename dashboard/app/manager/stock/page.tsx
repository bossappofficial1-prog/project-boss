"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import StockContent from "@/components/owner/stock/StockContent";

export default function ManagerStockPage() {
  return (
    <PrivilegeGuard requiredPrivilege="STOCK_MANAGEMENT">
      <StockContent />
    </PrivilegeGuard>
  );
}
