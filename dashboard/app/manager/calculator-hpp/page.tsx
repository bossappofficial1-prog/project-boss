"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import OwnerPage from "@/app/owner/calculator-hpp/page";

export default function ManagerCalculatorHppPage() {
  return (
    <PrivilegeGuard requiredPrivilege="TOOLS_CALCULATOR">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
