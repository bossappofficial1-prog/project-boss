"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OwnerPage from "@/app/owner/suppliers/page";

export default function ManagerSuppliersPage() {
  return (
    <PrivilegeGuard requiredPrivilege="STOCK_MANAGEMENT">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
