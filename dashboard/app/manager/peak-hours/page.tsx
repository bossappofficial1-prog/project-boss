"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OwnerPage from "@/app/owner/peak-hours/page";

export default function ManagerPeakHoursPage() {
  return (
    <PrivilegeGuard requiredPrivilege="ANALYTICS">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
