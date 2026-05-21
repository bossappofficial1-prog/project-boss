"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import OwnerPage from "@/app/owner/business-health/page";

export default function ManagerBusinessHealthPage() {
  return (
    <PrivilegeGuard requiredPrivilege="ANALYTICS">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
