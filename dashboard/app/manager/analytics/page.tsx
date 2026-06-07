"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OwnerPage from "@/app/owner/analytics/page";

export default function ManagerAnalyticsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="ANALYTICS">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
