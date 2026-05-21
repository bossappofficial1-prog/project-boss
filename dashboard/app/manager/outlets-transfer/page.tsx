"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import TransferManagementContent from "@/components/outlet/TransferManagementContent";

export default function ManagerOutletsTransferPage() {
  return (
    <PrivilegeGuard requiredPrivilege="OUTLET_MANAGEMENT">
      <TransferManagementContent />
    </PrivilegeGuard>
  );
}
