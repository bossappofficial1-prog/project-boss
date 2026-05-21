"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import OwnerPage from "@/app/owner/expenses/page";

export default function ManagerExpensesPage() {
  return (
    <PrivilegeGuard requiredPrivilege="FINANCE_REPORTS">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
