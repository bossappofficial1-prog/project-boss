"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import TransferManagementContent from "@/features/outlet/components/transfer-management-content";

export default function ManagerOutletsTransferPage() {
  return (
    <PrivilegeGuard requiredPrivilege="OUTLET_MANAGEMENT">
      <TransferManagementContent />
    </PrivilegeGuard>
  );
}
