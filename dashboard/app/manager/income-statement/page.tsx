"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OwnerPage from "@/app/owner/income-statement/page";

export default function ManagerIncomeStatementPage() {
  return (
    <PrivilegeGuard requiredPrivilege="ANALYTICS">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
