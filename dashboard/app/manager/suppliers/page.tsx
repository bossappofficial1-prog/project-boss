"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import OwnerPage from "@/app/owner/suppliers/page";

export default function ManagerSuppliersPage() {
  return (
    <PrivilegeGuard requiredPrivilege="STOCK_MANAGEMENT">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
