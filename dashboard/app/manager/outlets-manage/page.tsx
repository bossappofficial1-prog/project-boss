"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import ManageOutletContent from "@/features/outlet/components/manage-outlet-content";

export default function ManagerOutletsManagePage() {
  return (
    <PrivilegeGuard requiredPrivilege="OUTLET_MANAGEMENT">
      <ManageOutletContent />
    </PrivilegeGuard>
  );
}
