"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import OwnerPage from "@/app/owner/outlets-staff/page";

export default function ManagerOutletsStaffPage() {
  return (
    <PrivilegeGuard requiredPrivilege="OUTLET_MANAGEMENT">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
