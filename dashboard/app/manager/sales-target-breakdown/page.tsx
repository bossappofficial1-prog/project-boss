"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OwnerPage from "@/app/owner/sales-target-breakdown/page";

export default function ManagerSalesTargetBreakdownPage() {
  return (
    <PrivilegeGuard requiredPrivilege="TOOLS_CALCULATOR">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
