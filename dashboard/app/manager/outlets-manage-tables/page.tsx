"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import OwnerPage from "@/app/owner/outlets-manage-tables/page";

export default function ManagerOutletsManageTablesPage() {
  return (
    <PrivilegeGuard requiredPrivilege="OUTLET_MANAGEMENT">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
