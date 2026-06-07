"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import StockTransferContent from "@/features/owner/stock-transfer/stock-transfer-content";

export default function ManagerStockTransferPage() {
  return (
    <PrivilegeGuard requiredPrivilege="STOCK_MANAGEMENT">
      <StockTransferContent />
    </PrivilegeGuard>
  );
}
