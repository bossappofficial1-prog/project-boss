"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import StockTransferContent from "@/components/features/owner/stock-transfer/StockTransferContent";

export default function ManagerStockTransferPage() {
  return (
    <PrivilegeGuard requiredPrivilege="STOCK_MANAGEMENT">
      <StockTransferContent />
    </PrivilegeGuard>
  );
}
