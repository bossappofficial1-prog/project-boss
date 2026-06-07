"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OwnerPage from "@/app/owner/business-health/page";

export default function ManagerBusinessHealthPage() {
  return (
    <PrivilegeGuard requiredPrivilege="ANALYTICS">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
