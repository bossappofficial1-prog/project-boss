"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import OwnerPage from "@/app/owner/cashier-shifts/page";

export default function ManagerCashierShiftsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="FINANCE_REPORTS">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
