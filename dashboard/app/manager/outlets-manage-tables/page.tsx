"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OwnerPage from "@/app/owner/outlets-manage-tables/page";

export default function ManagerOutletsManageTablesPage() {
  return (
    <PrivilegeGuard requiredPrivilege="OUTLET_MANAGEMENT">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
