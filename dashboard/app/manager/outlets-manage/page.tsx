"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import ManageOutletContent from "@/components/outlet/ManageOutletContent";

export default function ManagerOutletsManagePage() {
  return (
    <PrivilegeGuard requiredPrivilege="OUTLET_MANAGEMENT">
      <ManageOutletContent />
    </PrivilegeGuard>
  );
}
