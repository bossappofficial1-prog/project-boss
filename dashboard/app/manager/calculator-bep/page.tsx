"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OwnerPage from "@/app/owner/calculator-bep/page";

export default function ManagerCalculatorBepPage() {
  return (
    <PrivilegeGuard requiredPrivilege="TOOLS_CALCULATOR">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
